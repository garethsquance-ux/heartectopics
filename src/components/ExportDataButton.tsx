import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ExportDataButton = () => {
  const { toast } = useToast();

  const exportToCSV = async () => {
    try {
      const { data: episodes, error } = await supabase
        .from('heart_episodes')
        .select('*')
        .order('episode_date', { ascending: false });

      if (error) throw error;

      if (!episodes || episodes.length === 0) {
        toast({
          title: "No Data",
          description: "You haven't logged any episodes yet.",
        });
        return;
      }

      // Create CSV content
      const headers = ['Date', 'Severity', 'Symptoms', 'Duration (seconds)', 'Notes'];
      const csvRows = [headers.join(',')];

      episodes.forEach(episode => {
        const row = [
          format(new Date(episode.episode_date), 'yyyy-MM-dd HH:mm:ss'),
          episode.severity || '',
          `"${(episode.symptoms || '').replace(/"/g, '""')}"`, // Escape quotes
          episode.duration_seconds || '',
          `"${(episode.notes || '').replace(/"/g, '""')}"` // Escape quotes
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `heart-episodes-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Complete",
        description: `Successfully exported ${episodes.length} episodes to CSV.`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={exportToCSV}
      variant="outline"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Export Data (CSV)
    </Button>
  );
};

export default ExportDataButton;