import {
  PlayIcon,
  StopIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid"
import Loading from "@/components/widgets/loading"
import {
  Breadcrumb,
  BreadcrumbCurrent,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/widgets/breadcrumb"
import useContainers from "@/hooks/useContainers"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import apiBaseUrl from "@/lib/api-base-url"
import { IContainer, IPort } from "@/lib/api-models"
import { useState } from "react"
import DeleteContainerDialog from "./dialogs/delete-container-dialog"
import TopBar from "@/components/widgets/top-bar"
import TopBarActions from "@/components/widgets/top-bar-actions"
import MainArea from "@/components/widgets/main-area"
import MainContent from "@/components/widgets/main-content"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import useNodeHead from "@/hooks/useNodeHead"
import { ArrowUpRight } from "lucide-react"
import EditContainerBaseUrlDialog from "../nodes/dialogs/edit-containerbaseurl-dialog"
import {
  CLASSES_CLICKABLE_TABLE_ROW,
  CLASSES_TABLE_ACTION_ICON,
} from "@/lib/utils"

export default function Containers() {
  const { nodeId } = useParams()
  const { nodeHead } = useNodeHead(nodeId!)

  const navigate = useNavigate()
  const { isLoading, mutateContainers, containers } = useContainers(nodeId!)
  const [deleteContainerOpen, setDeleteContainerOpen] = useState(false)
  const [container, setContainer] = useState<IContainer | null>(null)

  if (isLoading) return <Loading />

  const handleStartContainer = async (id: string) => {
    try {
      await axios(`${apiBaseUrl()}/nodes/${nodeId}/containers/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ id: id }),
      })

      mutateContainers()
      toast({
        title: "Success!",
        description: "Container started.",
      })
    } catch (e) {
      if (axios.isAxiosError(e)) {
        toast({
          variant: "destructive",
          title: "Failed",
          description: e.response?.data,
        })
      }
    }
  }

  const handleStopContainer = async (id: string) => {
    const response = await fetch(
      `${apiBaseUrl()}/nodes/${nodeId}/containers/stop`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id }),
      }
    )
    if (!response.ok) {
      const r = await response.json()
      toast({
        variant: "destructive",
        title: "Failed",
        description: r.errors?.body,
      })
    } else {
      mutateContainers()
      toast({
        title: "Success!",
        description: "Container stopped.",
      })
    }
  }

  const handleRestartContainer = async (id: string) => {
    const response = await fetch(
      `${apiBaseUrl()}/nodes/${nodeId}/containers/restart`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id }),
      }
    )
    if (!response.ok) {
      const r = await response.json()
      toast({
        variant: "destructive",
        title: "Failed",
        description: r.errors?.body,
      })
    } else {
      mutateContainers()
      toast({
        title: "Success!",
        description: "Container restarted.",
      })
    }
  }

  const handleDeleteContainer = (container: IContainer) => {
    setContainer({ ...container })
    setDeleteContainerOpen(true)
  }

  function getPortsHtml(ports: IPort[]) {
    const arr = ports.map((p, i) => {
      let ret = ""

      if (p.ip) ret += `${p.ip}:`
      if (p.publicPort) ret += `${p.publicPort}->`
      if (p.privatePort) ret += `${p.privatePort}`
      if (p.type) ret += `/${p.type}`

      let baseUrl = nodeHead?.containerBaseUrl
      if (p.ip === "0.0.0.0" || p.ip == "::") {
        if (!baseUrl) {
          baseUrl = `${location.protocol}//${location.hostname}`
        }
      } else {
        baseUrl = `${location.protocol}//${p.ip}`
      }

      const url = `${baseUrl}:${p.publicPort}`

      return (
        <div key={i}>
          {p.publicPort ? (
            <a
              className="inline-block p-1 text-amber-600 hover:underline hover:underline-offset-2"
              target="_blank"
              href={url}
              onClick={(e) => e.stopPropagation()}
            >
              {ret}
              <ArrowUpRight className="ml-1 inline w-4" />
            </a>
          ) : (
            <span>{ret}</span>
          )}
          <br />
        </div>
      )
    })
    return arr
  }

  return (
    <MainArea>
      {deleteContainerOpen && (
        <DeleteContainerDialog
          openState={deleteContainerOpen}
          setOpenState={setDeleteContainerOpen}
          container={container!}
        />
      )}
      <TopBar>
        <Breadcrumb>
          <BreadcrumbLink to="/nodes">Nodes</BreadcrumbLink>
          <BreadcrumbSeparator />
          <BreadcrumbCurrent>{nodeHead?.name}</BreadcrumbCurrent>
          <BreadcrumbSeparator />
          <BreadcrumbCurrent>Containers</BreadcrumbCurrent>
        </Breadcrumb>
        <TopBarActions>
          <EditContainerBaseUrlDialog />
        </TopBarActions>
      </TopBar>
      <MainContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Id</TableHead>
              <TableHead scope="col">Name</TableHead>
              <TableHead scope="col">Ports</TableHead>
              <TableHead scope="col">State</TableHead>
              <TableHead scope="col">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!containers?.items && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No data to display
                </TableCell>
              </TableRow>
            )}
            {containers?.items &&
              containers?.items.map((item) => (
                <TableRow
                  key={item.id}
                  className={CLASSES_CLICKABLE_TABLE_ROW}
                  onClick={() => {
                    navigate(`/nodes/${nodeId}/containers/${item.name}/logs`)
                  }}
                >
                  <TableCell>{item.id.substring(0, 12)}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{getPortsHtml(item.ports)}</TableCell>
                  <TableCell>
                    {item.state == "exited" ? (
                      <Badge variant="destructive" title={item.status}>
                        {item.state}
                      </Badge>
                    ) : (
                      <Badge variant="default" title={item.status}>
                        {item.state}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <>
                      {item.state == "running" && (
                        <Button
                          variant="ghost"
                          size={"sm"}
                          title="Restart"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestartContainer(item.id)
                          }}
                        >
                          <ArrowPathIcon className="w-4 text-green-600 dark:text-green-400" />
                        </Button>
                      )}
                      {item.state == "exited" ? (
                        <Button
                          variant="ghost"
                          size={"sm"}
                          title="Start"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartContainer(item.id)
                          }}
                        >
                          <PlayIcon className="w-4 text-green-600 dark:text-green-400" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size={"sm"}
                          title="Stop"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStopContainer(item.id)
                          }}
                        >
                          <StopIcon className="w-4 text-red-600 dark:text-red-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size={"sm"}
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteContainer(item)
                        }}
                      >
                        <TrashIcon
                          className={CLASSES_TABLE_ACTION_ICON}
                          color="#1c1b1a"
                        />
                      </Button>
                    </>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </MainContent>
    </MainArea>
  )
}
