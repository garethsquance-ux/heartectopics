import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const postSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().min(1, "Content is required"),
  category: z.enum(["general", "guide", "research", "medical_advances", "studies", "personal_stories"]),
  comments_enabled: z.boolean(),
});

type PostFormData = z.infer<typeof postSchema>;

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostUpdated: () => void;
  postId: string;
  initialData: {
    title: string;
    content: string;
    category: "general" | "guide" | "research" | "medical_advances" | "studies" | "personal_stories";
    comments_enabled: boolean;
  };
}

const EditPostDialog = ({
  open,
  onOpenChange,
  onPostUpdated,
  postId,
  initialData,
}: EditPostDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    if (open) {
      form.reset(initialData);
    }
  }, [open, initialData, form]);

  const handleSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to edit posts",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('community_posts')
        .update({
          title: data.title,
          content: data.content,
          category: data.category,
          comments_enabled: data.comments_enabled,
        })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post updated successfully",
      });

      onOpenChange(false);
      onPostUpdated();
      form.reset();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Update the post details and settings
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter post title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="medical_advances">Medical Advances</SelectItem>
                      <SelectItem value="studies">Studies</SelectItem>
                      <SelectItem value="personal_stories">Personal Stories</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your post content here..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comments_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Comments</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Allow users to comment on this post
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Post"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostDialog;
