import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, Edit, ImageIcon, Video, Headphones } from "lucide-react";
import { toast } from "sonner";

type MediaItem = {
  type: "image" | "video" | "audio";
  url: string;
};

type Blog = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url?: string | null;
  media: MediaItem[] | null;
  is_published: boolean;
  created_at: string;
  author_id: string;
};

export const BlogsManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publish, setPublish] = useState(true);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const [existingMedia, setExistingMedia] = useState<MediaItem[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setPublish(true);
    setEditingBlog(null);
    setExistingMedia([]);
    setNewFiles([]);
  };

  // =================================================================
  // UPDATED QUERY — SAFE MEDIA PARSING (Fix for "return data as Blog[]")
  // =================================================================
  const { data: blogs, isLoading } = useQuery<Blog[]>({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsed = (data || []).map((b: any) => {
        let media: MediaItem[] = [];

        try {
          if (Array.isArray(b.media)) media = b.media;
          else if (typeof b.media === "string") media = JSON.parse(b.media);
        } catch {
          media = [];
        }

        return {
          ...b,
          media,
        } as Blog;
      });

      return parsed;
    },
    enabled: !!user,
  });

  // Upload files to Supabase Storage
  const uploadFiles = async (files: File[]): Promise<MediaItem[]> => {
    if (!files.length) return [];

    const uploaded: MediaItem[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-media")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("blog-media").getPublicUrl(path);

      const mime = file.type;
      let type: MediaItem["type"] = "image";
      if (mime.startsWith("video/")) type = "video";
      else if (mime.startsWith("audio/")) type = "audio";

      uploaded.push({ type, url: data.publicUrl });
    }

    return uploaded;
  };

  const createBlogMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!content.trim()) throw new Error("Content is required");

      const uploadedMedia = await uploadFiles(newFiles);

      const excerpt = content.length > 150 ? content.slice(0, 150) + "..." : content;

      const payload = {
        title: title.trim() || content.slice(0, 60) || "Untitled",
        content,
        excerpt,
        media: uploadedMedia,
        author_id: user.id,
        is_published: publish,
      };

      const { error } = await supabase.from("blogs").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Blog created successfully");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to create blog"),
  });

  const updateBlogMutation = useMutation({
    mutationFn: async () => {
      if (!editingBlog) throw new Error("No blog selected");
      if (!content.trim()) throw new Error("Content is required");

      const uploadedMedia = await uploadFiles(newFiles);
      const finalMedia = [...existingMedia, ...uploadedMedia];

      const excerpt = content.length > 150 ? content.slice(0, 150) + "..." : content;

      const payload = {
        title: title.trim() || content.slice(0, 60) || "Untitled",
        content,
        excerpt,
        media: finalMedia,
        is_published: publish,
      };

      const { error } = await supabase
        .from("blogs")
        .update(payload)
        .eq("id", editingBlog.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Blog updated successfully");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to update blog"),
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Blog deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-blogs"] });
    },
    onError: () => toast.error("Failed to delete blog"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    editingBlog ? updateBlogMutation.mutate() : createBlogMutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentImageCount =
      existingMedia.filter((m) => m.type === "image").length +
      newFiles.filter((f) => f.type.startsWith("image/")).length;

    let allowedFiles: File[] = [];
    let rejectedImages = 0;

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        if (
          currentImageCount +
            allowedFiles.filter((f) => f.type.startsWith("image/")).length <
          4
        ) {
          allowedFiles.push(file);
        } else {
          rejectedImages++;
        }
      } else {
        allowedFiles.push(file);
      }
    }

    if (rejectedImages > 0) toast.error("Maximum 4 images allowed");

    setNewFiles((prev) => [...prev, ...allowedFiles]);
    e.target.value = "";
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setTitle(blog.title || "");
    setContent(blog.content || "");
    setPublish(blog.is_published);
    setExistingMedia((blog.media || []) as MediaItem[]);
    setNewFiles([]);
  };

  const handleRemoveExistingMedia = (index: number) => {
    setExistingMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isSubmitting =
    createBlogMutation.isPending || updateBlogMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* FACEBOOK STYLE POST CREATOR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {editingBlog ? "Edit Blog" : "Create Blog"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Short blog title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Share your Ayurveda tips, remedies, stories..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {/* MEDIA UPLOAD */}
            <div className="space-y-2">
              <Label>Media (Images / Video / Audio)</Label>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    const input = document.getElementById("blog-media-input");
                    if (input) input.click();
                  }}
                >
                  <ImageIcon className="h-4 w-4" />
                  <Video className="h-4 w-4" />
                  <Headphones className="h-4 w-4" />
                  <span>Add Media</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Switch
                    id="publish"
                    checked={publish}
                    onCheckedChange={setPublish}
                  />
                  <Label htmlFor="publish">Publish immediately</Label>
                </div>
              </div>

              <input
                id="blog-media-input"
                type="file"
                multiple
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* MEDIA PREVIEW */}
            {(existingMedia.length > 0 || newFiles.length > 0) && (
              <div className="space-y-3">
                {existingMedia.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Existing media</p>
                    <div className="flex flex-wrap gap-3">
                      {existingMedia.map((m, idx) => (
                        <div
                          key={idx}
                          className="relative border rounded-md p-1 max-w-[120px]"
                        >
                          {m.type === "image" && (
                            <img
                              src={m.url}
                              alt="blog media"
                              className="w-full h-24 object-cover rounded"
                            />
                          )}
                          {m.type === "video" && (
                            <video
                              src={m.url}
                              className="w-full h-24 object-cover rounded"
                              controls
                            />
                          )}
                          {m.type === "audio" && (
                            <audio controls className="w-full">
                              <source src={m.url} />
                            </audio>
                          )}
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => handleRemoveExistingMedia(idx)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newFiles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">New uploads</p>
                    <div className="flex flex-wrap gap-3">
                      {newFiles.map((file, idx) => {
                        const isImage = file.type.startsWith("image/");
                        const isVideo = file.type.startsWith("video/");
                        const isAudio = file.type.startsWith("audio/");

                        return (
                          <div
                            key={idx}
                            className="relative border rounded-md p-1 max-w-[120px]"
                          >
                            {isImage && (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-24 object-cover rounded"
                              />
                            )}
                            {isVideo && (
                              <video
                                src={URL.createObjectURL(file)}
                                className="w-full h-24 object-cover rounded"
                                controls
                              />
                            )}
                            {isAudio && (
                              <audio controls className="w-full">
                                <source src={URL.createObjectURL(file)} />
                              </audio>
                            )}
                            {!isImage && !isVideo && !isAudio && (
                              <p className="text-xs p-2 break-words">{file.name}</p>
                            )}

                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={() => handleRemoveNewFile(idx)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingBlog ? "Update Blog" : "Post Blog"}
              </Button>
              {editingBlog && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* BLOG FEED (FACEBOOK STYLE) */}
      <div className="space-y-4">
        {blogs && blogs.length > 0 ? (
          blogs.map((blog) => {
            const media = (blog.media || []) as MediaItem[];

            const images = media.filter((m) => m.type === "image");
            const videos = media.filter((m) => m.type === "video");
            const audios = media.filter((m) => m.type === "audio");

            return (
              <Card key={blog.id} className="shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {blog.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(blog.created_at).toLocaleString()}
                      {blog.is_published ? " • Published" : " • Draft"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(blog)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteBlogMutation.mutate(blog.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm whitespace-pre-wrap">
                    {blog.content}
                  </p>

                  {/* IMAGES GRID */}
                  {images.length > 0 && (
                    <div
                      className={
                        images.length === 1
                          ? "grid grid-cols-1 gap-2"
                          : images.length === 2
                          ? "grid grid-cols-2 gap-2"
                          : "grid grid-cols-2 gap-2"
                      }
                    >
                      {images.slice(0, 4).map((img, idx) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt={`blog image ${idx + 1}`}
                          className="w-full max-h-64 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  )}

                  {/* FIRST VIDEO */}
                  {videos[0] && (
                    <div className="mt-2">
                      <video
                        src={videos[0].url}
                        controls
                        className="w-full max-h-[360px] rounded-md"
                      />
                    </div>
                  )}

                  {/* FIRST AUDIO */}
                  {audios[0] && (
                    <div className="mt-2">
                      <audio controls className="w-full">
                        <source src={audios[0].url} />
                      </audio>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <p className="text-center text-muted-foreground">
            No blog posts yet. Create your blog 
          </p>
        )}
      </div>
    </div>
  );
};
