import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Leaf, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const addToCart = async () => {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      navigate("/auth");
      return;
    }

    if (!product) return;

    const { error } = await supabase
      .from("cart_items")
      .upsert({
        user_id: user.id,
        product_id: product.id,
        quantity: 1,
      }, {
        onConflict: "user_id,product_id",
      });

    if (error) {
      toast.error("Failed to add to cart");
    } else {
      toast.success("Added to cart!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-lg mb-8" />
            <div className="h-8 bg-muted rounded w-1/2 mb-4" />
            <div className="h-4 bg-muted rounded w-full mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product not found</h2>
          <Button onClick={() => navigate("/products")}>Back to Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/products")} className="mb-6">
          ← Back to Products
        </Button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 aspect-square flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Leaf className="h-32 w-32 text-primary" />
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-4xl font-bold text-foreground">{product.name}</h1>
                <Badge variant={product.stock_count > 0 ? "default" : "destructive"}>
                  <Package className="mr-1 h-3 w-3" />
                  {product.stock_count > 0 ? `${product.stock_count} in stock` : "Out of stock"}
                </Badge>
              </div>
              <p className="text-3xl font-bold text-primary">${product.price}</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {product.benefits && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-semibold mb-2 text-primary">Benefits</h3>
                  <p className="text-foreground whitespace-pre-line">{product.benefits}</p>
                </CardContent>
              </Card>
            )}

            {product.ingredients && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Ingredients</h3>
                <p className="text-muted-foreground">{product.ingredients}</p>
              </div>
            )}

            {product.usage_instructions && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Usage Instructions</h3>
                <p className="text-muted-foreground whitespace-pre-line">{product.usage_instructions}</p>
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full"
              onClick={addToCart}
              disabled={product.stock_count === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {product.stock_count === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
