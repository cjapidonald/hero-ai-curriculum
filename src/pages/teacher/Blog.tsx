import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

const Blog = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Blog</h2>
        <p className="text-muted-foreground">
          Read educational posts and teaching resources
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Lightbulb className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Blog Section Coming Soon</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Access educational blog posts, teaching tips, curriculum resources, and professional
            development materials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Blog;
