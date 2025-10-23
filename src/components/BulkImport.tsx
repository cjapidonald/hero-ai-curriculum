import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface BulkImportProps {
  type: 'students' | 'teachers' | 'classes';
  onImportComplete?: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export function BulkImport({ type, onImportComplete }: BulkImportProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getTableName = () => {
    switch (type) {
      case 'students':
        return 'dashboard_students';
      case 'teachers':
        return 'teachers';
      case 'classes':
        return 'classes';
    }
  };

  const getTemplateData = () => {
    switch (type) {
      case 'students':
        return [
          'Name,Surname,Email,Password,Class,Gender,Level,Birthday,Parent Name,Parent Zalo,Location,Sessions,Sessions Left,Is Active',
          'John,Doe,john.doe@example.com,password123,A1,Male,Beginner,2010-01-15,Jane Doe,0901234567,Hanoi,20,20,true',
          'Mary,Smith,mary.smith@example.com,password456,A1,Female,Pre-A1,2011-03-20,Bob Smith,0912345678,HCMC,20,20,true',
        ].join('\n');
      case 'teachers':
        return [
          'Name,Surname,Email,Password,Subject,Phone,Hourly Rate,Is Active',
          'Sarah,Johnson,sarah.j@example.com,password123,English,0901111111,150000,true',
          'Mike,Brown,mike.b@example.com,password456,Math,0902222222,180000,true',
        ].join('\n');
      case 'classes':
        return [
          'Name,Level,Stage,Schedule,Max Students,Start Date,Is Active',
          'Class A1 Morning,A1,Stage 1,Mon/Wed 9:00-10:30,12,2025-02-01,true',
          'Class A2 Evening,A2,Stage 2,Tue/Thu 18:00-19:30,12,2025-02-01,true',
        ].join('\n');
    }
  };

  const downloadTemplate = () => {
    const template = getTemplateData();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-import-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'Fill in the template and upload it to import data.',
    });
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split('\n');
    return lines.map(line => {
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      return values;
    });
  };

  const convertStudentRow = (headers: string[], values: string[]) => {
    const data: Record<string, any> = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      const headerLower = header.toLowerCase();

      if (headerLower.includes('name') && !headerLower.includes('parent')) {
        data.name = value;
      } else if (headerLower.includes('surname')) {
        data.surname = value;
      } else if (headerLower.includes('email')) {
        data.email = value;
      } else if (headerLower.includes('password')) {
        data.password = value;
      } else if (headerLower.includes('class')) {
        data.class = value;
      } else if (headerLower.includes('gender')) {
        data.gender = value;
      } else if (headerLower.includes('level')) {
        data.level = value;
      } else if (headerLower.includes('birthday')) {
        data.birthday = value;
      } else if (headerLower.includes('parent') && headerLower.includes('name')) {
        data.parent_name = value;
      } else if (headerLower.includes('parent') && headerLower.includes('zalo')) {
        data.parent_zalo_nr = value;
      } else if (headerLower.includes('location')) {
        data.location = value;
      } else if (headerLower.includes('sessions left')) {
        data.sessions_left = parseInt(value) || 0;
      } else if (headerLower.includes('sessions')) {
        data.sessions = parseInt(value) || 0;
      } else if (headerLower.includes('active')) {
        data.is_active = value.toLowerCase() === 'true';
      }
    });

    data.subject = 'English';
    data.attendance_rate = 0;
    return data;
  };

  const convertTeacherRow = (headers: string[], values: string[]) => {
    const data: Record<string, any> = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      const headerLower = header.toLowerCase();

      if (headerLower.includes('name') && !headerLower.includes('surname')) {
        data.name = value;
      } else if (headerLower.includes('surname')) {
        data.surname = value;
      } else if (headerLower.includes('email')) {
        data.email = value;
      } else if (headerLower.includes('password')) {
        data.password = value;
      } else if (headerLower.includes('subject')) {
        data.subject = value;
      } else if (headerLower.includes('phone')) {
        data.phone = value;
      } else if (headerLower.includes('rate')) {
        data.hourly_rate = parseFloat(value) || 0;
      } else if (headerLower.includes('active')) {
        data.is_active = value.toLowerCase() === 'true';
      }
    });
    return data;
  };

  const convertClassRow = (headers: string[], values: string[]) => {
    const data: Record<string, any> = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      const headerLower = header.toLowerCase();

      if (headerLower.includes('name')) {
        data.name = value;
      } else if (headerLower.includes('level')) {
        data.level = value;
      } else if (headerLower.includes('stage')) {
        data.stage = value;
      } else if (headerLower.includes('schedule')) {
        data.schedule = value;
      } else if (headerLower.includes('max')) {
        data.max_students = parseInt(value) || 12;
      } else if (headerLower.includes('start date')) {
        data.start_date = value;
      } else if (headerLower.includes('active')) {
        data.is_active = value.toLowerCase() === 'true';
      }
    });

    data.current_students = 0;
    return data;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setProgress(0);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);

        if (rows.length < 2) {
          throw new Error('CSV file is empty or has no data rows');
        }

        const headers = rows[0];
        const dataRows = rows.slice(1);

        const importResult: ImportResult = {
          success: 0,
          failed: 0,
          errors: [],
        };

        for (let i = 0; i < dataRows.length; i++) {
          const rowNumber = i + 2; // +2 because row 1 is headers and arrays are 0-indexed
          const values = dataRows[i];

          try {
            let data: Record<string, any>;
            if (type === 'students') {
              data = convertStudentRow(headers, values);
            } else if (type === 'teachers') {
              data = convertTeacherRow(headers, values);
            } else {
              data = convertClassRow(headers, values);
            }

            const { error } = await supabase.from(getTableName()).insert(data);

            if (error) {
              throw error;
            }

            importResult.success++;
          } catch (error: any) {
            importResult.failed++;
            importResult.errors.push({
              row: rowNumber,
              error: error.message || 'Unknown error',
            });
          }

          setProgress(Math.round(((i + 1) / dataRows.length) * 100));
        }

        setResult(importResult);

        if (importResult.success > 0) {
          toast({
            title: 'Import Complete',
            description: `Successfully imported ${importResult.success} ${type}. ${importResult.failed} failed.`,
          });

          if (onImportComplete) {
            onImportComplete();
          }
        } else {
          toast({
            title: 'Import Failed',
            description: 'No records were imported successfully.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        toast({
          title: 'Import Error',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple {type} at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Step 1: Download Template</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download the CSV template, fill it with your data, and save it.
                  </p>
                  <Button onClick={downloadTemplate} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload File */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Step 2: Upload CSV File</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select your filled CSV file to begin the import process.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={importing}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {importing ? 'Importing...' : 'Select File'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          {importing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">{result.success} records imported successfully</span>
                  </div>

                  {result.failed > 0 && (
                    <>
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-semibold">{result.failed} records failed</span>
                      </div>

                      {result.errors.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold mb-2">Errors:</p>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {result.errors.map((err, idx) => (
                              <p key={idx} className="text-xs text-muted-foreground">
                                Row {err.row}: {err.error}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2 text-sm">Tips:</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Ensure your CSV file matches the template format exactly</li>
                <li>Use "true" or "false" for boolean fields (Is Active)</li>
                <li>Make sure email addresses are unique</li>
                <li>Check that all required fields are filled</li>
                <li>Date format should be YYYY-MM-DD</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
