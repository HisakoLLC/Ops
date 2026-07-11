"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, UserMinus, Mail, Trash2, KeyRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TeamClient({ initialMembers, initialInvites, currentUserId }: any) {
  const router = useRouter();
  const supabase = createClient();
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || "Failed to send invite");
      
      toast.success(`Invite sent to ${inviteEmail}`);
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvite = async (id: string) => {
    const { error } = await supabase
      .from("team_invites")
      .update({ status: "cancelled" })
      .eq("id", id);
      
    if (error) {
      toast.error("Failed to cancel invite");
      return;
    }
    toast.success("Invite cancelled");
    router.refresh();
  };

  const handleRemoveMember = async (id: string) => {
    if (id === currentUserId) return;
    if (!confirm("Are you sure you want to remove this member? This action cannot be undone.")) return;
    
    try {
      const response = await fetch(`/api/team/member/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to remove member");
      
      toast.success("Member removed successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSendResetPassword = async (id: string, email?: string) => {
    if (!confirm(`Send password reset email to ${email || "this member"}?`)) return;

    try {
      const response = await fetch(`/api/team/member/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to send reset email");

      toast.success(result.message || "Password reset email sent");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogTrigger render={<Button className="bg-[#E8400C] hover:bg-[#E8400C]/90 text-white" />}>
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || "member")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isInviting} className="bg-[#E8400C] text-white">
                  {isInviting ? "Sending..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialMembers.map((member: any) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || ""} />
                        <AvatarFallback className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800">
                          {member.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {member.full_name || "Unknown"}
                          {member.id === currentUserId && <span className="ml-2 text-xs text-zinc-400 font-normal">(You)</span>}
                        </span>
                        <span className="text-xs text-zinc-500">{member.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {format(new Date(member.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Send Password Reset Email"
                      onClick={() => handleSendResetPassword(member.id, member.email)}
                      disabled={member.id === currentUserId}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Remove Member"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={member.id === currentUserId}
                      className={member.id !== currentUserId ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" : ""}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {initialInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialInvites.map((invite: any) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium text-sm">{invite.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invite.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {invite.profiles?.full_name || "System"}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {format(new Date(invite.created_at), "MMM d")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Resend">
                        <Mail className="h-4 w-4 text-zinc-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Cancel"
                        onClick={() => handleCancelInvite(invite.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
