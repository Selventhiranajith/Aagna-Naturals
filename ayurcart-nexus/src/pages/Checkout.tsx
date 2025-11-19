import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const ADMIN_WHATSAPP = "94741167143"; // Admin WhatsApp Number

  // Fetch cart items
  const { data: cartItems } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          products (*)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch profile details
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!user || !cartItems) throw new Error("Invalid state");

      const total = cartItems.reduce(
        (sum, item) => sum + (item.products?.price || 0) * item.quantity,
        0
      );

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          payment_status: "completed",
          delivery_status: "processing",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products?.name || "",
        quantity: item.quantity,
        price: item.products?.price || 0,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (clearError) throw clearError;

      return total;
    },

    onSuccess: (total) => {
      toast.success("Order placed successfully!");

      const message =
        `🛒 *New Order Received*\n\n` +
        `*Customer Details*\n` +
        `Name: ${profile?.name || "N/A"}\n` +
        `Phone: ${profile?.phone || "N/A"}\n` +
        `Address: ${profile?.address || "N/A"}\n\n` +
        `*Order Items*\n` +
        cartItems
          .map(
            (item) =>
              `- ${item.products?.name || "Item"} (x${
                item.quantity || 1
              })`
          )
          .join("\n") +
        `\n\n*Total Amount:* $${total.toFixed(2)}\n\n` +
        `Please confirm the order.`;

      // WhatsApp Redirect
      const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
        message
      )}`;

      window.location.href = url;
    },

    onError: () => {
      toast.error("Failed to place order");
      setProcessing(false);
    },
  });

  const handleCheckout = () => {
    setProcessing(true);
    setTimeout(() => {
      createOrderMutation.mutate();
    }, 1500);
  };

  const total = cartItems?.reduce(
    (sum, item) => sum + (item.products?.price || 0) * item.quantity,
    0
  ) || 0;

  // Redirect if not logged in
  if (!user) {
    navigate("/auth");
    return null;
  }

  // Redirect if no items
  if (!cartItems || cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Name:</strong> {profile?.name}</p>
                <p><strong>Phone:</strong> {profile?.phone || "Not provided"}</p>
                <p><strong>Address:</strong> {profile?.address || "Not provided"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.products?.name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-primary">
                        ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">${total.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">Free</span>
                  </div>

                  <div className="h-px bg-border my-4" />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={processing}
                >
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {processing ? "Processing..." : "Send Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
