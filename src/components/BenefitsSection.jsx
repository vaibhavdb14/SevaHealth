import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const BenefitsSection = ({ title, benefits, accentColor = "bg-primary" }) => {
  return (
    <div className="mb-12">
      <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <Card key={index} className="border-border/50 hover:shadow-card transition-smooth">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className={`${accentColor} rounded-full p-1 mt-1 flex-shrink-0`}>
                  <Check className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{benefit.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BenefitsSection;
