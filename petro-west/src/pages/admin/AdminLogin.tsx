import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAdminLogin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password required")
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries();
        setLocation("/admin");
      }
    }
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#001D3D] p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
         <img src={`${import.meta.env.BASE_URL}images/pattern-bg.png`} alt="" className="w-full h-full object-cover" />
      </div>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative z-10 border-t-8 border-t-secondary">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-secondary rounded-xl flex items-center justify-center mx-auto mb-6 transform rotate-12">
            <span className="text-primary font-display font-bold text-3xl leading-none -rotate-12">PW</span>
          </div>
          <h1 className="font-display text-4xl text-primary tracking-widest">Admin Portal</h1>
        </div>

        {loginMutation.isError && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3 mb-6 font-medium">
            <AlertCircle className="w-5 h-5" />
            Invalid credentials. Please try again.
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary">Email Address</FormLabel>
                <FormControl><Input className="h-12" placeholder="admin@petrowest.dz" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-primary">Password</FormLabel>
                <FormControl><Input type="password" className="h-12" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            
            <Button type="submit" className="w-full h-14 text-lg font-display tracking-widest hover-elevate" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
