import { Dispatch, SetStateAction, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import useVariables from "@/hooks/useVariables"
import { IVariableHead } from "@/lib/api-models"
import apiBaseUrl from "@/lib/api-base-url"

export default function EditVariableValueDialog({
  openState,
  setOpenState,
  variableHead,
  environmentId,
}: {
  openState: boolean
  setOpenState: Dispatch<SetStateAction<boolean>>
  variableHead: IVariableHead
  environmentId: string
}) {
  const [isSaving, setIsSaving] = useState(false)
  const { mutateVariables } = useVariables()

  const formSchema = z.object({
    value: z.string(),
  })

  type FormSchemaType = z.infer<typeof formSchema>

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: variableHead.values![environmentId] },
  })

  const handleCloseForm = () => {
    setOpenState(false)
    form.reset()
  }

  const onSubmit: SubmitHandler<FormSchemaType> = async (data) => {
    setIsSaving(true)
    const response = await fetch(
      `${apiBaseUrl()}/variables/${variableHead.id}/values/${environmentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }
    )
    if (!response.ok) {
      handleCloseForm()
      toast({
        variant: "destructive",
        title: "Something went wrong.",
        description: "There was a problem when saving the value. Try again!",
      })
    } else {
      mutateVariables()
      setTimeout(() => {
        handleCloseForm()
        toast({
          title: "Success!",
          description: "Value has been saved.",
        })
      }, 500)
    }
    setIsSaving(false)
  }

  return (
    <Dialog open={openState} onOpenChange={setOpenState}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset className={cn("group")} disabled={isSaving}>
              <DialogHeader>
                <DialogTitle>Edit Value</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 group-disabled:opacity-50">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  className={cn(
                    "relative w-24 group-disabled:pointer-events-none"
                  )}
                  type="submit"
                >
                  <Icons.spinner
                    className={cn(
                      "absolute animate-spin text-slate-100 group-enabled:opacity-0"
                    )}
                  />
                  <span className={cn("group-disabled:opacity-0")}>Save</span>
                </Button>
                <Button
                  type="button"
                  className="w-24"
                  variant={"secondary"}
                  onClick={handleCloseForm}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </fieldset>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
