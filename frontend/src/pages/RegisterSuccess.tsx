import { Card, CardTitle, CardDescription, CardHeader, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "react-day-picker";


const RegisterSuccess = () => {
  return (
      <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
              <CardHeader>
                  <CardTitle>Registration Successful!</CardTitle>
                  <CardDescription>
                      Your account has been created. Please wait for admin approval.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <Link to="/login">
                      <Button className="w-full">Go to Login</Button>
                  </Link>
              </CardContent>
          </Card>
      </div>
  );
};

export default RegisterSuccess;