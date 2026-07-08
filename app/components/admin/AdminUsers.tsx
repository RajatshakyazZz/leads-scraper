"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Search, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";

export function AdminUsers() {
  const { adminFetch } = useAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [confirmAction, setConfirmAction] = useState<{action: string, uid: string, name: string} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleAction(uid: string, action: string, value?: any) {
    if (action === "ban" || action === "delete" || action === "reset_usage") {
      const user = users.find(u => u.uid === uid);
      setConfirmAction({ action, uid, name: user?.email || user?.displayName || "User" });
      return;
    }
    
    await executeAction(uid, action, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function executeAction(uid: string, action: string, value?: any) {
    setActionLoading(true);
    try {
      const isDelete = action === "delete";
      const method = isDelete ? "DELETE" : "PATCH";
      const url = `/api/admin/users/${uid}`;
      
      const res = await adminFetch(url, {
        method,
        headers: isDelete ? undefined : { "Content-Type": "application/json" },
        body: isDelete ? undefined : JSON.stringify({ action, value })
      });
      
      if (res.ok) {
        toast.success(`Action '${action}' successful`);
        loadUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-3xl">Users</h1>
        <p className="text-muted-foreground mt-1">Manage platform users, plans, and limits.</p>
      </div>

      <Card>
        <div className="p-4 border-b border-border flex items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by email or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary text-xs uppercase">
                          {user.email?.charAt(0) || user.displayName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.displayName || "No Name"}</div>
                          <div className="text-xs text-muted-foreground">{user.email || "No Email"}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.plan === "pro" ? "default" : "secondary"} className="uppercase text-[10px]">
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{user.leadsUsed || 0}</span>
                      <span className="text-xs text-muted-foreground ml-1">/ {user.leadLimit}</span>
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive" className="text-[10px] uppercase">Banned</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] uppercase border-green-500/50 text-green-600 bg-green-500/10">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.plan === "free" ? (
                          <Button variant="outline" size="xs" onClick={() => handleAction(user.uid, "set_plan", "pro")}>
                            <ArrowUpCircle className="w-3 h-3 mr-1" /> Pro
                          </Button>
                        ) : (
                          <Button variant="outline" size="xs" onClick={() => handleAction(user.uid, "set_plan", "free")}>
                            <ArrowDownCircle className="w-3 h-3 mr-1" /> Free
                          </Button>
                        )}
                        
                        {user.banned ? (
                          <Button variant="outline" size="xs" onClick={() => handleAction(user.uid, "unban")}>
                            Unban
                          </Button>
                        ) : (
                          <Button variant="outline" size="xs" onClick={() => handleAction(user.uid, "ban")} className="text-amber-600 hover:text-amber-700">
                            Ban
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="icon-xs" onClick={() => handleAction(user.uid, "delete")} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === "delete" ? "Delete User" : 
               confirmAction?.action === "ban" ? "Ban User" : "Reset Usage"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === "delete" && `Are you sure you want to permanently delete ${confirmAction.name}? This will remove all their leads and data. This action cannot be undone.`}
              {confirmAction?.action === "ban" && `Are you sure you want to ban ${confirmAction.name}? They will no longer be able to log in.`}
              {confirmAction?.action === "reset_usage" && `Reset lead usage to 0 for ${confirmAction.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button 
              variant={confirmAction?.action === "delete" ? "destructive" : "default"}
              onClick={() => confirmAction && executeAction(confirmAction.uid, confirmAction.action)}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
