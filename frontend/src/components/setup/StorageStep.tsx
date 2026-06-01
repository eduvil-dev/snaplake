import { useState } from "react"
import {
  TextInput,
  Button,
  RadioButtonGroup,
  RadioButton,
  InlineLoading,
} from "@carbon/react"
import { CheckmarkFilled, ErrorFilled } from "@carbon/react/icons"
import { api } from "@/lib/api"

export interface StorageData {
  storageType: "LOCAL" | "S3" | "SMB"
  localPath: string
  s3Bucket: string
  s3Region: string
  s3Endpoint: string
  s3AccessKey: string
  s3SecretKey: string
  smbHost: string
  smbPort: string
  smbShare: string
  smbPath: string
  smbDomain: string
  smbUsername: string
  smbPassword: string
}

interface StorageStepProps {
  data: StorageData
  onChange: (data: StorageData) => void
  onNext: () => void
  onBack: () => void
}

export function StorageStep({ data, onChange, onNext, onBack }: StorageStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (data.storageType === "LOCAL") {
      if (!data.localPath.trim()) {
        newErrors.localPath = "Path is required"
      }
    } else if (data.storageType === "S3") {
      if (!data.s3Bucket.trim()) {
        newErrors.s3Bucket = "Bucket name is required"
      }
      if (!data.s3Region.trim()) {
        newErrors.s3Region = "Region is required"
      }
    } else {
      if (!data.smbHost.trim()) {
        newErrors.smbHost = "Host is required"
      }
      if (!data.smbShare.trim()) {
        newErrors.smbShare = "Share name is required"
      }
      if (data.smbPort.trim()) {
        const port = Number(data.smbPort)
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          newErrors.smbPort = "Port must be between 1 and 65535"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleTest() {
    if (!validate()) return

    setTestStatus("testing")
    try {
      const res = await api.post<{ success: boolean }>("/api/setup/test-storage", {
        storageType: data.storageType,
        localPath: data.localPath || null,
        s3Bucket: data.s3Bucket || null,
        s3Region: data.s3Region || null,
        s3Endpoint: data.s3Endpoint || null,
        s3AccessKey: data.s3AccessKey || null,
        s3SecretKey: data.s3SecretKey || null,
        smbHost: data.storageType === "SMB" ? data.smbHost || null : null,
        smbPort:
          data.storageType === "SMB" && data.smbPort
            ? parseInt(data.smbPort, 10)
            : null,
        smbShare: data.storageType === "SMB" ? data.smbShare || null : null,
        smbPath: data.storageType === "SMB" ? data.smbPath || null : null,
        smbDomain: data.storageType === "SMB" ? data.smbDomain || null : null,
        smbUsername: data.storageType === "SMB" ? data.smbUsername || null : null,
        smbPassword: data.storageType === "SMB" ? data.smbPassword || null : null,
      })
      setTestStatus(res.success ? "success" : "error")
    } catch {
      setTestStatus("error")
    }
  }

  function handleNext() {
    if (validate()) {
      onNext()
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Storage Settings</h2>
        <p style={{ marginTop: "0.5rem", color: "var(--cds-text-secondary)" }}>
          Configure where Snaplake stores database snapshots.
        </p>
      </div>

      <RadioButtonGroup
        legendText="Storage Type"
        name="storageType"
        valueSelected={data.storageType}
        onChange={(value) =>
          onChange({ ...data, storageType: value as "LOCAL" | "S3" | "SMB" })
        }
        orientation="vertical"
      >
        <RadioButton labelText="Local Filesystem" value="LOCAL" id="storage-local" />
        <RadioButton labelText="S3 Compatible Storage" value="S3" id="storage-s3" />
        <RadioButton labelText="SMB Network Share" value="SMB" id="storage-smb" />
      </RadioButtonGroup>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {data.storageType === "LOCAL" && (
          <TextInput
            id="localPath"
            labelText="Storage Path"
            value={data.localPath}
            onChange={(e) => onChange({ ...data, localPath: e.target.value })}
            placeholder="/data/snaplake"
            invalid={!!errors.localPath}
            invalidText={errors.localPath}
          />
        )}
        {data.storageType === "S3" && (
          <>
            <TextInput
              id="s3Bucket"
              labelText="Bucket Name"
              value={data.s3Bucket}
              onChange={(e) => onChange({ ...data, s3Bucket: e.target.value })}
              placeholder="my-snaplake-bucket"
              invalid={!!errors.s3Bucket}
              invalidText={errors.s3Bucket}
            />
            <TextInput
              id="s3Region"
              labelText="Region"
              value={data.s3Region}
              onChange={(e) => onChange({ ...data, s3Region: e.target.value })}
              placeholder="us-east-1"
              invalid={!!errors.s3Region}
              invalidText={errors.s3Region}
            />
            <TextInput
              id="s3Endpoint"
              labelText="Custom Endpoint (optional)"
              value={data.s3Endpoint}
              onChange={(e) => onChange({ ...data, s3Endpoint: e.target.value })}
              placeholder="https://minio.example.com"
            />
            <TextInput
              id="s3AccessKey"
              labelText="Access Key"
              value={data.s3AccessKey}
              onChange={(e) => onChange({ ...data, s3AccessKey: e.target.value })}
            />
            <TextInput
              id="s3SecretKey"
              type="password"
              labelText="Secret Key"
              value={data.s3SecretKey}
              onChange={(e) => onChange({ ...data, s3SecretKey: e.target.value })}
            />
          </>
        )}
        {data.storageType === "SMB" && (
          <>
            <TextInput
              id="smbHost"
              labelText="Host"
              value={data.smbHost}
              onChange={(e) => onChange({ ...data, smbHost: e.target.value })}
              placeholder="192.168.1.100 or nas.local"
              invalid={!!errors.smbHost}
              invalidText={errors.smbHost}
            />
            <TextInput
              id="smbPort"
              labelText="Port (optional, default 445)"
              value={data.smbPort}
              onChange={(e) => onChange({ ...data, smbPort: e.target.value })}
              placeholder="445"
              invalid={!!errors.smbPort}
              invalidText={errors.smbPort}
            />
            <TextInput
              id="smbShare"
              labelText="Share Name"
              value={data.smbShare}
              onChange={(e) => onChange({ ...data, smbShare: e.target.value })}
              placeholder="snapshots"
              invalid={!!errors.smbShare}
              invalidText={errors.smbShare}
            />
            <TextInput
              id="smbPath"
              labelText="Sub Path (optional)"
              value={data.smbPath}
              onChange={(e) => onChange({ ...data, smbPath: e.target.value })}
              placeholder="backups/snaplake"
            />
            <TextInput
              id="smbDomain"
              labelText="Domain (optional)"
              value={data.smbDomain}
              onChange={(e) => onChange({ ...data, smbDomain: e.target.value })}
              placeholder="WORKGROUP"
            />
            <TextInput
              id="smbUsername"
              labelText="Username (empty for guest access)"
              value={data.smbUsername}
              onChange={(e) => onChange({ ...data, smbUsername: e.target.value })}
            />
            <TextInput
              id="smbPassword"
              type="password"
              labelText="Password"
              value={data.smbPassword}
              onChange={(e) => onChange({ ...data, smbPassword: e.target.value })}
            />
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Button
          kind="tertiary"
          size="sm"
          onClick={handleTest}
          disabled={testStatus === "testing"}
        >
          Test Connection
        </Button>
        {testStatus === "testing" && <InlineLoading description="Testing..." />}
        {testStatus === "success" && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", color: "var(--cds-support-success)" }}>
            <CheckmarkFilled size={16} /> Connected
          </span>
        )}
        {testStatus === "error" && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem", color: "var(--cds-support-error)" }}>
            <ErrorFilled size={16} /> Connection failed
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <Button kind="secondary" onClick={onBack} style={{ flex: 1 }}>
          Back
        </Button>
        <Button onClick={handleNext} style={{ flex: 1 }}>
          Next
        </Button>
      </div>
    </div>
  )
}
