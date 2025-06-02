import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { DealType, DealStage } from "@shared/schema";

const dealFormSchema = z.object({
  type: z.enum(["RENTAL", "SALES"]),
  title: z.string().min(1, "Property title is required"),
  clientName: z.string().min(1, "Client name is required"),
  stage: z.string().min(1, "Stage is required"),
  amountYen: z.coerce.number().min(1, "Amount must be greater than 0"),
  assignedToId: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionDue: z.string().optional(),
});

type DealFormData = z.infer<typeof dealFormSchema>;

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealType: DealType;
  onSuccess: () => void;
}

export default function DealModal({ isOpen, onClose, dealType, onSuccess }: DealModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      type: dealType,
      title: "",
      clientName: "",
      stage: "",
      amountYen: 0,
      assignedToId: "",
      nextAction: "",
      nextActionDue: "",
    },
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const createDealMutation = useMutation({
    mutationFn: async (data: DealFormData) => {
      setIsSubmitting(true);
      try {
        const response = await apiRequest("POST", "/api/deals", data);
        return response.json();
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Deal created successfully",
      });
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create deal",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DealFormData) => {
    createDealMutation.mutate(data);
  };

  const getRentalStages = (): { value: DealStage; label: string }[] => [
    { value: "R_ENQUIRY", label: "Enquiry" },
    { value: "R_VIEW", label: "Viewing" },
    { value: "R_APP", label: "Application" },
    { value: "R_SCREEN", label: "Screening" },
    { value: "R_APPROVE", label: "Approved" },
    { value: "R_CONTRACT", label: "Contract" },
    { value: "R_MOVEIN", label: "Move-in" },
  ];

  const getSalesStages = (): { value: DealStage; label: string }[] => [
    { value: "S_ENQUIRY", label: "Enquiry" },
    { value: "S_VIEW", label: "Viewing" },
    { value: "S_LOI", label: "LOI" },
    { value: "S_DEPOSIT", label: "Deposit" },
    { value: "S_DD", label: "Due Diligence" },
    { value: "S_APPROVE", label: "Approved" },
    { value: "S_CONTRACT", label: "Contract" },
    { value: "S_CLOSING", label: "Closing" },
  ];

  const stages = dealType === "RENTAL" ? getRentalStages() : getSalesStages();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Create New {dealType === "RENTAL" ? "Rental" : "Sales"} Deal
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 3BR Shibuya Apartment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Client full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amountYen"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Amount (¥) {dealType === "RENTAL" ? "- Monthly" : "- Total"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder={dealType === "RENTAL" ? "Monthly rent" : "Sale price"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Agent</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextAction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Action</FormLabel>
                  <FormControl>
                    <Input placeholder="Next step to take" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextActionDue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Action Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Deal"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
