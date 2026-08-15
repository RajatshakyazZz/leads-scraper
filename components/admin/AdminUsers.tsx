"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Trash2, ShieldAlert, Edit, UserX, UserCheck, RefreshCw, Star, Info, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";

export function AdminUsers() {
  const { adminFetch } = useAdmin();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Selected user for editing details
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Edit form states
  const [statusVal, setStatusVal] = useState("Active");
  const [leadLimitVal, setLeadLimitVal] = useState(15);
  const [monthlyVal, setMonthlyVal] = useState(0);
  const [dailyVal, setDailyVal] = useState(0);
  const [creditsVal, setCreditsVal] = useState(0);
  const [notesVal, setNotesVal] = useState("");
  
  const [confirmAction, setConfirmAction] = useState<{action: string, uid: string, name: string} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/users?search=${encodeURIComponent(search)}&limit=100`);
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  // Populate edit fields when selectedUser changes
  useEffect(() => {
    if (selectedUser) {
      setStatusVal(selectedUser.status || (selectedUser.banned ? "Blocked" : "Active"));
      setLeadLimitVal(selectedUser.leadLimit || 15);
      setMonthlyVal(selectedUser.monthlyQuota || 0);
      setDailyVal(selectedUser.dailyQuota || 0);
      setCreditsVal(selectedUser.customCredits || 0);
      setNotesVal(selectedUser.adminNotes || "");
    }
  }, [selectedUser]);

  async function handleAction(uid: string, action: string, value?: any) {
    if (action === "delete" || action === "reset_usage" || action === "reset_quota" || action === "ban") {
      const user = users.find(u => u.uid === uid);
      setConfirmAction({ action, uid, name: user?.email || user?.displayName || "User" });
      return;
    }
    await executeAction(uid, action, value);
  }

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
        toast.success(`Action successfully executed`);
        if (selectedUser && selectedUser.uid === uid) {
          // Refresh selectedUser data
          const updatedUser = await res.json();
          setSelectedUser(updatedUser);
        }
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

  async function saveProfileEdit() {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const url = `/api/admin/users/${selectedUser.uid}`;
      const res = await adminFetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_profile",
          value: {
            status: statusVal,
            leadLimit: Number(leadLimitVal),
            monthlyQuota: Number(monthlyVal),
            dailyQuota: Number(dailyVal),
            customCredits: Number(creditsVal),
            adminNotes: notesVal
          }
        })
      });
      
      if (res.ok) {
        toast.success("User profile updated successfully");
        setSelectedUser(null);
        loadUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Save profile failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  // Filter list locally based on inputs
  const filteredUsers = users.filter((u) => {
    if (planFilter !== "all" && u.plan !== planFilter) return false;
    
    const userStatus = u.status || (u.banned ? "Blocked" : "Active");
    if (statusFilter !== "all" && userStatus !== statusFilter) return false;
    
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-lime-400 uppercase tracking-widest mb-1">
            <UsersIcon className="w-3.5 h-3.5" /> User Directory & Quotas
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Users Database</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor user registrations, lifetime lead generation usage, and adjust quotas.</p>
        </div>
      </div>

      <Card className="bg-slate-900/80 border-slate-800/90 shadow-xl backdrop-blur-xl rounded-2xl overflow-hidden">
        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row gap-3 bg-slate-950/40">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by email or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9.5 h-10 text-xs bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-lime-500/30 focus-visible:border-lime-500/50 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 focus:outline-none focus:border-lime-500/50"
            >
              <option value="all">All Plans</option>
              <option value="free">Free Plan</option>
              <option value="pro">Pro Plan</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 focus:outline-none focus:border-lime-500/50"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
        </div>
        
        {/* Users Table */}
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/60 border-b border-slate-800/80">
              <TableRow className="border-slate-800/80 hover:bg-transparent">
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">User Profile</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">Plan</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">Quota / Lifetime</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">Status</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3">Joined</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-3 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-slate-800/60">
                    <TableCell><Skeleton className="h-10 w-[200px] bg-slate-800" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 bg-slate-800" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12 bg-slate-800" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 bg-slate-800" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 bg-slate-800" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto bg-slate-800" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow className="border-slate-800/60">
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 text-xs">
                    No users matching filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const userStatus = user.status || (user.banned ? "Blocked" : "Active");
                  return (
                    <TableRow key={user.uid} className="border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lime-400 text-xs uppercase shadow-sm">
                            {user.email?.charAt(0) || user.displayName?.charAt(0) || "U"}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-100">{user.displayName || "No Name"}</div>
                            <div className="text-[11px] font-mono text-slate-400">{user.email || "No Email"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase text-[9px] font-mono px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700">
                          {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <span className="font-bold text-lime-400">{user.leadsUsed || 0}</span>
                        <span className="text-slate-500 ml-1">/ {user.leadLimit || 15}</span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                            userStatus === "Active" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" :
                            userStatus === "Suspended" ? "border-amber-500/30 text-amber-400 bg-amber-500/10" : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                          }`}
                        >
                          {userStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="xs" 
                          onClick={() => setSelectedUser(user)}
                          className="h-7 text-[11px] px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 rounded-lg transition-all"
                        >
                          <Edit className="w-3 h-3 mr-1 text-lime-400" /> Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User details and edit profile dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Info className="h-5 w-5 text-primary" />
              User Profile Details
            </DialogTitle>
            <DialogDescription className="text-xs">
              View usage statistics, update custom lead generation limits, or adjust account status.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              {/* Profile Card Summary */}
              <div className="flex items-center justify-between border border-border bg-muted/20 p-3 rounded-lg text-xs">
                <div>
                  <div className="font-semibold text-sm">{selectedUser.displayName || "Unknown User"}</div>
                  <div className="text-muted-foreground mt-0.5">{selectedUser.email || "No email available"}</div>
                  <div className="text-muted-foreground text-[10px] mt-1">UID: {selectedUser.uid}</div>
                </div>
                <div className="text-right text-[10px] text-muted-foreground space-y-0.5">
                  <div>Joined: {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "-"}</div>
                  <div>Last Login: {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : "-"}</div>
                  <div>Plan: <span className="font-semibold uppercase text-primary">{selectedUser.plan}</span></div>
                </div>
              </div>

              {/* Edit Quotas & Limits */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="leadLimit" className="text-[11px]">Lifetime Quota (Leads Limit)</Label>
                  <Input 
                    id="leadLimit" 
                    type="number" 
                    value={leadLimitVal} 
                    onChange={(e) => setLeadLimitVal(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="customCredits" className="text-[11px]">Custom Credits Balance</Label>
                  <Input 
                    id="customCredits" 
                    type="number" 
                    value={creditsVal} 
                    onChange={(e) => setCreditsVal(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="monthlyVal" className="text-[11px]">Monthly Quota Limit</Label>
                  <Input 
                    id="monthlyVal" 
                    type="number" 
                    value={monthlyVal} 
                    onChange={(e) => setMonthlyVal(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="dailyVal" className="text-[11px]">Daily Quota Limit</Label>
                  <Input 
                    id="dailyVal" 
                    type="number" 
                    value={dailyVal} 
                    onChange={(e) => setDailyVal(Number(e.target.value))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Status and Notes */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="col-span-1 space-y-1">
                  <Label htmlFor="statusSelect" className="text-[11px]">Account Status</Label>
                  <select
                    id="statusSelect"
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>
                
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="notesVal" className="text-[11px]">Admin Notes (Internal)</Label>
                  <Textarea 
                    id="notesVal"
                    rows={1}
                    value={notesVal}
                    onChange={(e) => setNotesVal(e.target.value)}
                    placeholder="Add operational notes here..."
                    className="text-xs min-h-[32px] py-1 px-3"
                  />
                </div>
              </div>

              {/* Quick Action Operations */}
              <div className="border-t border-border pt-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">Quick Operations</div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => handleAction(selectedUser.uid, "reset_usage")} 
                    disabled={actionLoading}
                    className="text-xs h-7"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset Usage ({selectedUser.leadsUsed || 0})
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={() => handleAction(selectedUser.uid, "reset_quota")} 
                    disabled={actionLoading}
                    className="text-xs h-7"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset Daily/Monthly Quotas
                  </Button>
                  
                  {selectedUser.banned ? (
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => handleAction(selectedUser.uid, "restore")} 
                      disabled={actionLoading}
                      className="text-xs text-green-600 hover:text-green-700 h-7"
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Restore User
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="xs" 
                      onClick={() => handleAction(selectedUser.uid, "ban")} 
                      disabled={actionLoading}
                      className="text-xs text-amber-600 hover:text-amber-700 h-7"
                    >
                      <UserX className="h-3 w-3 mr-1" />
                      Ban / Suspend
                    </Button>
                  )}

                  <Button 
                    variant="destructive" 
                    size="xs" 
                    onClick={() => handleAction(selectedUser.uid, "delete")} 
                    disabled={actionLoading}
                    className="text-xs ml-auto h-7"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete User
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-3 mt-2">
            <DialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
            <Button 
              variant="default"
              size="sm"
              onClick={saveProfileEdit}
              disabled={actionLoading}
            >
              {actionLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Operations Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Confirm Action
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {confirmAction?.action === "delete" && `Are you sure you want to permanently delete user account ${confirmAction.name}? This will clear their entire scraping session history, leads, audit details, build drafts, and outreach templates. This action is irreversible.`}
              {confirmAction?.action === "ban" && `Are you sure you want to block/ban ${confirmAction.name}? Their login token will be invalidated.`}
              {confirmAction?.action === "reset_usage" && `Confirm resetting lifetime scraped usage counts to zero for ${confirmAction.name}?`}
              {confirmAction?.action === "reset_quota" && `Confirm resetting daily and monthly quota counters back to zero for ${confirmAction.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
            <Button 
              variant={confirmAction?.action === "delete" ? "destructive" : "default"}
              size="sm"
              onClick={() => confirmAction && executeAction(confirmAction.uid, confirmAction.action)}
              disabled={actionLoading}
            >
              {actionLoading ? "Processing..." : "Confirm Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
