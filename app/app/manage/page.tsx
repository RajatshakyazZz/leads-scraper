"use client";

import { useState } from "react";
import { AdminProvider, useAdmin } from "@/components/admin/AdminProvider";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminLogs } from "@/components/admin/AdminLogs";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";

function AdminContent() {
  const { authenticated, loading } = useAdmin();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!authenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "dashboard" && <AdminDashboard />}
            {activeTab === "users" && <AdminUsers />}
            {activeTab === "settings" && <AdminSettings />}
            {activeTab === "analytics" && <AdminAnalytics />}
            {activeTab === "logs" && <AdminLogs />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function ManagePage() {
  return (
    <AdminProvider>
      <AdminContent />
      <Toaster position="bottom-right" richColors />
    </AdminProvider>
  );
}
