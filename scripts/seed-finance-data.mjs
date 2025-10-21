import { createClient } from '@supabase/supabase-js';

const {
  VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY,
  ADMIN_EMAIL = 'admin@heroschool.com',
  ADMIN_PASSWORD = 'admin123',
} = process.env;

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  process.exit(1);
}

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
  },
});

const SEED_PAYMENTS = [
  {
    receipt_number: 'RCPT-2025-0001',
    plan: '3_months',
    amount: 6_600_000,
    payment_method: 'Bank Transfer',
    payment_date: '2025-01-05',
    notes: 'Renewal for spring term',
  },
  {
    receipt_number: 'RCPT-2025-0002',
    plan: '6_months',
    amount: 12_000_000,
    payment_method: 'Card',
    payment_date: '2025-01-10',
    notes: 'Family opted for semester bundle',
  },
  {
    receipt_number: 'RCPT-2025-0003',
    plan: '12_months',
    amount: 20_400_000,
    payment_method: 'Cash',
    payment_date: '2025-01-12',
    notes: 'Full year commitment with referral discount applied',
  },
];

const SEED_PAYROLL = [
  {
    period_start: '2024-12-01',
    period_end: '2024-12-31',
    hours_worked: 48,
    hourly_rate: 350_000,
    base_amount: 16_800_000,
    bonus: 1_500_000,
    deductions: 200_000,
    payment_status: 'paid',
    payment_method: 'Bank Transfer',
    payment_date: '2025-01-03',
    notes: 'Strong attendance, includes holiday bonus',
  },
  {
    period_start: '2025-01-01',
    period_end: '2025-01-31',
    hours_worked: 50,
    hourly_rate: 350_000,
    base_amount: 17_500_000,
    bonus: 1_000_000,
    deductions: 0,
    payment_status: 'approved',
    payment_method: 'Pending',
    payment_date: null,
    notes: 'January sessions approved, awaiting transfer',
  },
];

async function ensureAuthenticated() {
  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (error) {
    console.error('Failed to sign in as admin:', error.message);
    process.exit(1);
  }
}

async function fetchTeacher() {
  const { data, error } = await supabase
    .from('teachers')
    .select('id, name, surname')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Unable to load teacher list:', error.message);
    process.exit(1);
  }

  if (!data) {
    console.error('No teachers found. Add a teacher before seeding payroll.');
    process.exit(1);
  }

  return data;
}

async function fetchStudentsForClass(className) {
  const { data, error } = await supabase
    .from('dashboard_students')
    .select('id, name, surname, class')
    .eq('is_active', true)
    .eq('class', className)
    .order('created_at', { ascending: true })
    .limit(SEED_PAYMENTS.length);

  if (error) {
    console.error(`Failed to load students for class ${className}:`, error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error(`No active students found for class ${className}.`);
    process.exit(1);
  }

  return data;
}

async function seedPayments(students) {
  const paymentRows = [];

  for (let index = 0; index < SEED_PAYMENTS.length; index += 1) {
    const payment = SEED_PAYMENTS[index];
    const student = students[index % students.length];

    const { data: existing, error: lookupError } = await supabase
      .from('payments')
      .select('id')
      .eq('receipt_number', payment.receipt_number)
      .maybeSingle();

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error(`Failed checking existing payment ${payment.receipt_number}:`, lookupError.message);
      process.exit(1);
    }

    if (existing) {
      console.log(`Skipping payment ${payment.receipt_number} (already exists).`);
      continue;
    }

    paymentRows.push({
      student_id: student.id,
      receipt_number: payment.receipt_number,
      payment_for: `${payment.plan.replace('_', ' ')} subscription`,
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      notes: payment.notes,
      term: payment.plan,
    });
  }

  if (paymentRows.length === 0) {
    console.log('No new payments inserted.');
    return;
  }

  const { error } = await supabase.from('payments').insert(paymentRows);

  if (error) {
    console.error('Failed to insert payments:', error.message);
    process.exit(1);
  }

  console.log(`Inserted ${paymentRows.length} sample payment(s).`);
}

async function seedPayroll(teacher) {
  const payrollRows = [];

  for (const payroll of SEED_PAYROLL) {
    const { data: existing, error: lookupError } = await supabase
      .from('payroll')
      .select('id')
      .eq('teacher_id', teacher.id)
      .eq('period_start', payroll.period_start)
      .eq('period_end', payroll.period_end)
      .maybeSingle();

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error(
        `Failed checking existing payroll for ${payroll.period_start} – ${payroll.period_end}:`,
        lookupError.message,
      );
      process.exit(1);
    }

    if (existing) {
      console.log(
        `Skipping payroll for ${payroll.period_start} – ${payroll.period_end} (already exists).`,
      );
      continue;
    }

    payrollRows.push({
      teacher_id: teacher.id,
      period_start: payroll.period_start,
      period_end: payroll.period_end,
      hours_worked: payroll.hours_worked,
      hourly_rate: payroll.hourly_rate,
      base_amount: payroll.base_amount,
      bonus: payroll.bonus,
      deductions: payroll.deductions,
      payment_status: payroll.payment_status,
      payment_method: payroll.payment_method,
      payment_date: payroll.payment_date,
      notes: payroll.notes,
      total_amount: payroll.base_amount + payroll.bonus - payroll.deductions,
    });
  }

  if (payrollRows.length === 0) {
    console.log('No new payroll rows inserted.');
    return;
  }

  const { error } = await supabase.from('payroll').insert(payrollRows);

  if (error) {
    console.error('Failed to insert payroll rows:', error.message);
    process.exit(1);
  }

  console.log(`Inserted ${payrollRows.length} sample payroll record(s) for ${teacher.name} ${teacher.surname}.`);
}

async function main() {
  console.log('Seeding finance data...');
  await ensureAuthenticated();
  const teacher = await fetchTeacher();
  const students = await fetchStudentsForClass('Alvin');
  await seedPayments(students);
  await seedPayroll(teacher);
  console.log('Finance data seeding complete.');
}

main().catch((error) => {
  console.error('Unexpected error while seeding finance data:', error);
  process.exit(1);
});
