import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  content: z.string().min(50, "Content must be at least 50 characters"),
  category: z.enum(["general", "guide", "research", "medical_advances", "studies", "personal_stories"]),
});

type PostFormData = z.infer<typeof postSchema>;

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export const CreatePostDialog = ({ open, onOpenChange, onPostCreated }: CreatePostDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "guide",
    },
  });

  const handleSubmit = async (data: PostFormData, publish: boolean) => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create posts",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('community_posts')
        .insert({
          title: data.title,
          content: data.content,
          category: data.category,
          author_id: session.user.id,
          is_published: publish,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: publish ? "Post published successfully" : "Post saved as draft",
      });

      form.reset();
      onOpenChange(false);
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Community Post</DialogTitle>
          <DialogDescription>
            Share research, medical advances, or personal stories with the community
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="guide">Guide / How-To</SelectItem>
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
                      className="min-h-[300px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => form.handleSubmit((data) => handleSubmit(data, false))()}
            disabled={submitting}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => form.handleSubmit((data) => handleSubmit(data, true))()}
            disabled={submitting}
          >
            Publish Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
