import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface EpisodeTimerProps {
  startTime: Date;
}

const EpisodeTimer = ({ startTime }: EpisodeTimerProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const start = startTime.getTime();
      setElapsed(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3">
        <Clock className="h-6 w-6 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Episode Duration</p>
          <p className="text-3xl font-bold text-foreground">{formatTime(elapsed)}</p>
        </div>
      </div>
    </Card>
  );
};

export default EpisodeTimer;
