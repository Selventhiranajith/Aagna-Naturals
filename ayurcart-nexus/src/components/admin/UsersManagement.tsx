import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export const UsersManagement = () => {
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          orders (
            *,
            order_items (
              *,
              products (name)
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user: any) => (
                <Collapsible
                  key={user.id}
                  open={openUserId === user.id}
                  onOpenChange={(open) => setOpenUserId(open ? user.id : null)}
                  asChild
                >
                  <>
                    <TableRow className="cursor-pointer">
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.phone || "N/A"}</TableCell>
                      <TableCell>{user.address || "N/A"}</TableCell>
                      <TableCell>
                        <Badge>{user.orders?.length || 0}</Badge>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <CollapsibleTrigger asChild>
                        <TableCell>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              openUserId === user.id ? "rotate-180" : ""
                            }`}
                          />
                        </TableCell>
                      </CollapsibleTrigger>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/50 p-6">
                          <h4 className="font-semibold mb-3">Purchase History</h4>
                          {user.orders && user.orders.length > 0 ? (
                            <div className="space-y-3">
                              {user.orders.map((order: any) => (
                                <div key={order.id} className="border rounded p-3 bg-background">
                                  <div className="flex justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">
                                      Order #{order.id.slice(0, 8)}
                                    </span>
                                    <span className="font-semibold">${order.total_amount}</span>
                                  </div>
                                  <div className="text-sm space-y-1">
                                    {order.order_items?.map((item: any) => (
                                      <div key={item.id}>
                                        {item.products?.name} x{item.quantity} - ${item.price}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-2 mt-2">
                                    <Badge variant="outline">{order.payment_status}</Badge>
                                    <Badge variant="outline">{order.delivery_status}</Badge>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {new Date(order.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No orders yet</p>
                          )}
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
