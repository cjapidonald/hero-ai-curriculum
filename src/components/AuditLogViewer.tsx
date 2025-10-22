import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Search, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { AdvancedFilters, FilterConfig } from '@/components/AdvancedFilters';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  changed_fields: string[];
  user_email: string;
  user_role: string;
  created_at: string;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFilters, setDateFilters] = useState<FilterConfig>({});
  const pageSize = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, tableFilter, actionFilter, dateFilters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Note: audit_logs table doesn't exist yet in database
      // This is a placeholder for when it's implemented
      setLogs([]);
      setTotalCount(0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(query) ||
      log.table_name.toLowerCase().includes(query) ||
      log.record_id.toLowerCase().includes(query)
    );
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>
            Complete history of all data changes ({totalCount} total records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by user, table, or record ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                <SelectItem value="dashboard_students">Students</SelectItem>
                <SelectItem value="teachers">Teachers</SelectItem>
                <SelectItem value="classes">Classes</SelectItem>
                <SelectItem value="payments">Payments</SelectItem>
                <SelectItem value="assessment">Assessments</SelectItem>
                <SelectItem value="skill_evaluations">Skills</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="INSERT">Created</SelectItem>
                <SelectItem value="UPDATE">Updated</SelectItem>
                <SelectItem value="DELETE">Deleted</SelectItem>
              </SelectContent>
            </Select>

            <AdvancedFilters
              onFilterChange={(filters) => {
                setDateFilters(filters);
                setPage(1); // Reset to first page when filters change
              }}
              showStatusFilter={false}
              showCategoryFilter={false}
              showAmountFilter={false}
              showDateFilter={true}
            />

            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{log.user_email || 'System'}</span>
                            {log.user_role && (
                              <Badge variant="outline" className="text-xs w-fit mt-1">
                                {log.user_role}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.table_name}
                          </code>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.record_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {log.changed_fields && log.changed_fields.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {log.changed_fields.slice(0, 3).map((field, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                              {log.changed_fields.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{log.changed_fields.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Audit Log Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-semibold mb-1">Timestamp</p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(new Date(log.created_at), 'PPpp')}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold mb-1">User</p>
                                    <p className="text-sm text-muted-foreground">
                                      {log.user_email || 'System'} ({log.user_role})
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold mb-1">Action</p>
                                    <Badge variant={getActionBadgeVariant(log.action)}>
                                      {log.action}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold mb-1">Table</p>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                      {log.table_name}
                                    </code>
                                  </div>
                                </div>

                                {log.changed_fields && log.changed_fields.length > 0 && (
                                  <div>
                                    <p className="text-sm font-semibold mb-2">Changed Fields</p>
                                    <div className="flex flex-wrap gap-2">
                                      {log.changed_fields.map((field, idx) => (
                                        <Badge key={idx} variant="secondary">
                                          {field}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {log.old_data && (
                                  <div>
                                    <p className="text-sm font-semibold mb-2">Old Data</p>
                                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                      {JSON.stringify(log.old_data, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {log.new_data && (
                                  <div>
                                    <p className="text-sm font-semibold mb-2">New Data</p>
                                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                      {JSON.stringify(log.new_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({totalCount} total records)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
