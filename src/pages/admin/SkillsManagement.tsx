import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SkillsManagement() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      navigate("/admin/dashboard?tab=curriculum", { replace: true });
    }, 2000);

    return () => window.clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-16">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Curriculum management has moved</CardTitle>
          <CardDescription>
            Skills, lesson planning, and teacher contributions now live under the Curriculum tab in the admin dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Use the new Curriculum workspace to review lesson progress, teacher resources, and behaviour insights. You will be
            redirected automatically, or jump there immediately below.
          </p>
          <Button onClick={() => navigate("/admin/dashboard?tab=curriculum", { replace: true })}>
            Go to Curriculum
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
