import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { ShoppingCart, Leaf, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Products = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // WhatsApp Sri Lanka number
  const WHATSAPP_NUMBER = "94741167143";

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent product navigation
    const url = `https://wa.me/${WHATSAPP_NUMBER}`;
    window.open(url, "_blank");
  };

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const addToCart = async (productId: string) => {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("cart_items")
      .upsert(
        {
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        },
        {
          onConflict: "user_id,product_id",
        }
      );

    if (error) {
      toast.error("Failed to add to cart");
    } else {
      toast.success("Added to cart!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Our Products</h1>
          <p className="text-muted-foreground">Discover authentic Ayurvedic wellness products</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-[var(--shadow-card)] transition-shadow cursor-pointer"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Leaf className="h-16 w-16 text-primary" />
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Stock: {product.stock_count}
                    </span>
                  </div>
                </CardContent>

                {/* Updated CardFooter with Add to Cart + Message Button */}
                <CardFooter className="flex gap-2">
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product.id);
                    }}
                    disabled={product.stock_count === 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {product.stock_count === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
                    onClick={handleWhatsApp}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No products available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
