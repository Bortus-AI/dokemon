import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { SubmitHandler, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn, trimString } from "@/lib/utils"
import useNodes from "@/hooks/useNodes"
import apiBaseUrl from "@/lib/api-base-url"
import useNodeHead from "@/hooks/useNodeHead"
import { useParams } from "react-router"
import { toast } from "@/components/ui/use-toast"

export default function EditContainerBaseUrlDialog() {
  const { nodeId } = useParams()
  const { nodeHead, mutateNodeHead } = useNodeHead(nodeId!)
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { mutateNodes } = useNodes()

  const formSchema = z.object({
    containerBaseUrl: z.preprocess(
      trimString,
      z.string().url("Invalid URL format").optional().or(z.literal(""))
    ),
  })

  type FormSchemaType = z.infer<typeof formSchema>

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => {
      return { containerBaseUrl: nodeHead?.containerBaseUrl }
    }, [nodeHead]),
  })

  useEffect(() => {
    form.reset({ containerBaseUrl: nodeHead?.containerBaseUrl })
  }, [nodeHead])

  const handleCloseForm = () => {
    setOpen(false)
    form.reset()
  }

  const onSubmit: SubmitHandler<FormSchemaType> = async (data) => {
    setIsSaving(true)
    const response = await fetch(`${apiBaseUrl()}/nodes/${nodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      handleCloseForm()
      toast({
        variant: "destructive",
        title: "Something went wrong.",
        description: "There was a problem saving the URL. Try again!",
      })
    } else {
      mutateNodeHead()
      mutateNodes()
      handleCloseForm()
      toast({
        title: "Success!",
        description: "Container Base URL has been saved.",
      })
    }
    setIsSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Edit Base URL</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset className={cn("group")} disabled={isSaving}>
              <DialogHeader>
                <DialogTitle>Container Base URL</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4 group-disabled:opacity-50">
                <FormField
                  control={form.control}
                  name="containerBaseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} autoFocus />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-sm">
                  If container port is bound to all IP addresses, this URL will
                  be used as the base URL.
                  <br />
                  If you leave this blank, the protocol and host from the
                  browser URL will be used as the base URL.
                </p>
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
