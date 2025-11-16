import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Leaf, ShoppingBag, Heart, Shield } from "lucide-react";
import heroImage from "@/assets/hero-ayurveda.jpg";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Leaf,
      title: "100% Natural",
      description: "Authentic Ayurvedic formulations using traditional methods",
    },
    {
      icon: ShoppingBag,
      title: "Easy Shopping",
      description: "Browse, cart, and checkout with secure payments",
    },
    {
      icon: Heart,
      title: "Wellness Focused",
      description: "Products designed for holistic health and balance",
    },
    {
      icon: Shield,
      title: "Quality Assured",
      description: "Doctor-verified ingredients and traditional recipes",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Ayurvedic wellness"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-earth-dark/80 to-earth-dark/40" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Protect Yourself With Aagna`s Herbal
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Discover authentic Ayurvedic products crafted with traditional methods and natural ingredients
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={() => navigate("/products")} className="bg-primary hover:bg-primary/90">
                Shop Now
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="bg-white/10 backdrop-blur text-white border-white hover:bg-white/20">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose AyurVeda Shop</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the benefits of authentic Ayurvedic wellness products
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-shadow">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Begin Your Wellness Journey?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands who have transformed their health with authentic Ayurvedic products
          </p>
          <Button size="lg" onClick={() => navigate("/products")}>
            Explore Products
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
