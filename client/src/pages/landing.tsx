import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, BarChart3, Users, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Home className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Real Estate Pipeline</h1>
            </div>
            <Button onClick={() => window.location.href = '/api/login'}>
              Sign In
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Manage Your Real Estate
            <span className="text-primary"> Pipeline</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Compare rental and sales funnels side-by-side with role-based access control, 
            automated deal scoring, and comprehensive analytics.
          </p>
          <div className="mt-10">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => window.location.href = '/api/login'}
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful Features for Real Estate Professionals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Dual Pipeline Management</CardTitle>
                <CardDescription>
                  Manage rental and sales deals side-by-side with automated scoring and ranking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Automated deal scoring system</li>
                  <li>• A/B/C grade ranking</li>
                  <li>• Stage progression tracking</li>
                  <li>• Next action management</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Role-Based Access Control</CardTitle>
                <CardDescription>
                  Secure access with granular permissions for different user roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Admin, Manager, Agent roles</li>
                  <li>• Granular data access</li>
                  <li>• Secure authentication</li>
                  <li>• Team collaboration</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Analytics & Reporting</CardTitle>
                <CardDescription>
                  Comprehensive insights into your pipeline performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Pipeline distribution charts</li>
                  <li>• Performance metrics</li>
                  <li>• Overdue action alerts</li>
                  <li>• Export capabilities</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to optimize your real estate pipeline?
          </h2>
          <Button 
            size="lg" 
            className="text-lg px-8 py-4"
            onClick={() => window.location.href = '/api/login'}
          >
            Start Managing Your Deals
          </Button>
        </div>
      </div>
    </div>
  );
}
