import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

const Blog = () => {
  const { data: blogs, isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Ayurveda Blog</h1>
          <p className="text-muted-foreground">
            Discover ancient wisdom and modern wellness insights
          </p>
        </div>

        {/* LOADING UI */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : blogs && blogs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {blogs.map((blog: any) => {
              // --------------------------
              // SAFE MEDIA PARSER
              // --------------------------
              let media: any[] = [];

              try {
                if (Array.isArray(blog.media)) {
                  media = blog.media;
                } else if (typeof blog.media === "string") {
                  media = JSON.parse(blog.media);
                }
              } catch (error) {
                media = [];
              }

              const images = media.filter((m) => m?.type === "image");
              const videos = media.filter((m) => m?.type === "video");
              const audios = media.filter((m) => m?.type === "audio");

              const coverImage =
                images[0]?.url || blog.image_url || null;

              return (
                <Card
                  key={blog.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* COVER IMAGE */}
                  {coverImage && (
                    <img
                      src={coverImage}
                      alt={blog.title}
                      className="h-48 w-full object-cover"
                    />
                  )}

                  <CardHeader>
                    <CardTitle>{blog.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(blog.created_at), "MMMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* EXCERPT */}
                    <p className="text-muted-foreground line-clamp-3">
                      {blog.excerpt || blog.content.substring(0, 150) + "..."}
                    </p>

                    {/* IMAGE GRID */}
                    {images.length > 0 && (
                      <div
                        className={
                          images.length === 1
                            ? "grid grid-cols-1 gap-2"
                            : "grid grid-cols-2 gap-2"
                        }
                      >
                        {images.slice(0, 4).map((img, idx) => (
                          <img
                            key={idx}
                            src={img.url}
                            alt={`blog-image-${idx}`}
                            className="w-full h-40 object-cover rounded-md"
                          />
                        ))}
                      </div>
                    )}

                    {/* VIDEO PLAYER */}
                    {videos.length > 0 && (
                      <div className="mt-2">
                        <video
                          controls
                          src={videos[0].url}
                          className="w-full rounded-md max-h-64"
                        />
                      </div>
                    )}

                    {/* AUDIO PLAYER */}
                    {audios.length > 0 && (
                      <div className="mt-2">
                        <audio controls className="w-full">
                          <source src={audios[0].url} />
                        </audio>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No blog posts available yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
