import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import {
  Button,
  Tile,
  TextInput,
  Tag,
  SkeletonText,
  SkeletonPlaceholder,
  InlineLoading,
  RadioButton,
  RadioButtonGroup,
} from "@carbon/react"
import {
  WarningAlt,
  CheckmarkFilled,
  CloseFilled,
} from "@carbon/react/icons"

interface StorageSettings {
  type: string
  localPath: string | null
  s3Bucket: string | null
  s3Region: string | null
  s3Endpoint: string | null
  s3AccessKey: string | null
  s3SecretKey: string | null
}

interface StorageTestResponse {
  success: boolean
}

export function StorageSettingsPage() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ["storage-settings"],
    queryFn: () => api.get<StorageSettings>("/api/storage"),
  })

  const [formData, setFormData] = useState<StorageSettings | null>(null)

  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle")

  const updateMutation = useMutation({
    mutationFn: (data: StorageSettings) =>
      api.put("/api/storage", {
        storageType: data.type,
        localPath: data.type === "LOCAL" ? data.localPath : null,
        s3Bucket: data.type === "S3" ? data.s3Bucket : null,
        s3Region: data.type === "S3" ? data.s3Region : null,
        s3Endpoint: data.type === "S3" ? data.s3Endpoint : null,
        s3AccessKey: data.type === "S3" ? data.s3AccessKey : null,
        s3SecretKey: data.type === "S3" ? data.s3SecretKey : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-settings"] })
      setIsEditing(false)
    },
  })

  async function handleTest() {
    setTestStatus("testing")
    try {
      const result = await api.post<StorageTestResponse>("/api/storage/test")
      setTestStatus(result.success ? "success" : "error")
    } catch {
      setTestStatus("error")
    }
  }

  function startEditing() {
    if (settings) {
      setFormData({
        ...settings,
        s3AccessKey: "",
        s3SecretKey: "",
      })
    }
    setIsEditing(true)
  }

  function handleSave() {
    if (formData) {
      updateMutation.mutate(formData)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <SkeletonText heading width="30%" />
        <SkeletonPlaceholder style={{ height: "12rem", width: "100%" }} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.025em" }}>
          Storage Settings
        </h1>
        <p style={{ color: "var(--cds-text-secondary)" }}>
          Configure where Snaplake stores database snapshots
        </p>
      </div>

      {!isEditing ? (
        /* View mode */
        <Tile>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Current Configuration</h2>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button kind="tertiary" size="sm" onClick={handleTest}>
                  {testStatus === "testing" && (
                    <InlineLoading style={{ marginRight: "0.25rem" }} />
                  )}
                  Test Connection
                </Button>
                <Button size="sm" onClick={startEditing}>
                  Edit
                </Button>
              </div>
            </div>

            {testStatus === "success" && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", color: "var(--cds-support-success)" }}>
                <CheckmarkFilled size={16} /> Connection successful
              </span>
            )}
            {testStatus === "error" && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", color: "var(--cds-support-error)" }}>
                <CloseFilled size={16} /> Connection failed
              </span>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ width: "8rem", color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>Type</span>
                <Tag type="outline" size="sm">{settings?.type}</Tag>
              </div>
              {settings?.type === "LOCAL" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ width: "8rem", color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>Path</span>
                  <code style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.875rem",
                    backgroundColor: "var(--cds-layer-02)",
                  }}>
                    {settings.localPath}
                  </code>
                </div>
              )}
              {settings?.type === "S3" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ width: "8rem", color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>Bucket</span>
                    <span style={{ fontSize: "0.875rem" }}>{settings.s3Bucket}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ width: "8rem", color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>Region</span>
                    <span style={{ fontSize: "0.875rem" }}>{settings.s3Region}</span>
                  </div>
                  {settings.s3Endpoint && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ width: "8rem", color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>Endpoint</span>
                      <span style={{ fontSize: "0.875rem" }}>{settings.s3Endpoint}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ width: "8rem", color: "var(--cds-text-secondary)", fontSize: "0.875rem" }}>Access Key</span>
                    <code style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.875rem",
                      backgroundColor: "var(--cds-layer-02)",
                    }}>
                      {settings.s3AccessKey}
                    </code>
                  </div>
                </>
              )}
            </div>
          </div>
        </Tile>
      ) : (
        /* Edit mode */
        <Tile>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Edit Configuration</h2>

            {formData && (
              <>
                {updateMutation.isError && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem",
                    fontSize: "0.875rem",
                    border: "1px solid var(--cds-support-error)",
                    backgroundColor: "var(--cds-notification-error-background-color, rgba(218, 30, 40, 0.1))",
                    color: "var(--cds-support-error)",
                  }}>
                    <WarningAlt size={16} style={{ flexShrink: 0 }} />
                    {updateMutation.error instanceof Error
                      ? updateMutation.error.message
                      : "Failed to update storage settings"}
                  </div>
                )}

                <RadioButtonGroup
                  legendText="Storage Type"
                  name="storage-type"
                  valueSelected={formData.type}
                  onChange={(value) =>
                    setFormData({ ...formData, type: String(value ?? "") })
                  }
                  orientation="vertical"
                >
                  <RadioButton
                    labelText="Local Filesystem — Store snapshots on the local disk"
                    value="LOCAL"
                    id="storage-local"
                  />
                  <RadioButton
                    labelText="S3 Compatible Storage — AWS S3, MinIO, or any S3-compatible storage"
                    value="S3"
                    id="storage-s3"
                  />
                </RadioButtonGroup>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {formData.type === "LOCAL" ? (
                    <TextInput
                      id="local-path"
                      labelText="Storage Path"
                      value={formData.localPath ?? ""}
                      onChange={(e) =>
                        setFormData({ ...formData, localPath: e.target.value })
                      }
                      placeholder="/data/snaplake"
                    />
                  ) : (
                    <>
                      <TextInput
                        id="s3-bucket"
                        labelText="Bucket Name"
                        value={formData.s3Bucket ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, s3Bucket: e.target.value })
                        }
                      />
                      <TextInput
                        id="s3-region"
                        labelText="Region"
                        value={formData.s3Region ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, s3Region: e.target.value })
                        }
                      />
                      <TextInput
                        id="s3-endpoint"
                        labelText="Custom Endpoint (optional)"
                        value={formData.s3Endpoint ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, s3Endpoint: e.target.value })
                        }
                      />
                      <TextInput
                        id="s3-access-key"
                        labelText="Access Key"
                        value={formData.s3AccessKey ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, s3AccessKey: e.target.value })
                        }
                        placeholder="Leave empty to keep current value"
                      />
                      <TextInput
                        id="s3-secret-key"
                        type="password"
                        labelText="Secret Key"
                        value={formData.s3SecretKey ?? ""}
                        onChange={(e) =>
                          setFormData({ ...formData, s3SecretKey: e.target.value })
                        }
                        placeholder="Leave empty to keep current value"
                      />
                    </>
                  )}
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <Button
                    kind="tertiary"
                    onClick={() => setIsEditing(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    style={{ flex: 1 }}
                  >
                    {updateMutation.isPending && (
                      <InlineLoading style={{ marginRight: "0.5rem" }} />
                    )}
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </div>
        </Tile>
      )}
    </div>
  )
}
