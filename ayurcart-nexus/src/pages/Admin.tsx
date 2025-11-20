import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProductsManagement } from "@/components/admin/ProductsManagement";
import { OrdersManagement } from "@/components/admin/OrdersManagement";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { BlogsManagement } from "@/components/admin/BlogsManagement";
import { toast } from "sonner";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error || !data) {
        toast.error("You don't have permission to access this page");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      setChecking(false);
    };

    checkAdmin();
  }, [user, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="blogs">Blogs</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <ProductsManagement />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrdersManagement />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="blogs" className="mt-6">
            <BlogsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
