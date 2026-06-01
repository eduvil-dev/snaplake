package io.clroot.snaplake.domain.model

enum class StorageType { LOCAL, S3, SMB }

class StorageConfig private constructor(
    val type: StorageType,
    val localPath: String?,
    val s3Bucket: String?,
    val s3Region: String?,
    val s3Endpoint: String?,
    val s3AccessKey: String?,
    val s3SecretKey: String?,
    val smbHost: String?,
    val smbPort: Int?,
    val smbShare: String?,
    val smbPath: String?,
    val smbDomain: String?,
    val smbUsername: String?,
    val smbPassword: String?,
) {
    companion object {
        fun local(path: String): StorageConfig {
            require(path.isNotBlank()) { "Local path must not be blank" }
            return StorageConfig(
                type = StorageType.LOCAL,
                localPath = path,
                s3Bucket = null, s3Region = null, s3Endpoint = null,
                s3AccessKey = null, s3SecretKey = null,
                smbHost = null, smbPort = null, smbShare = null,
                smbPath = null, smbDomain = null, smbUsername = null, smbPassword = null,
            )
        }

        fun s3(
            bucket: String,
            region: String,
            endpoint: String? = null,
            accessKey: String? = null,
            secretKey: String? = null,
        ): StorageConfig {
            require(bucket.isNotBlank()) { "S3 bucket must not be blank" }
            require(region.isNotBlank()) { "S3 region must not be blank" }
            return StorageConfig(
                type = StorageType.S3,
                localPath = null,
                s3Bucket = bucket, s3Region = region, s3Endpoint = endpoint,
                s3AccessKey = accessKey, s3SecretKey = secretKey,
                smbHost = null, smbPort = null, smbShare = null,
                smbPath = null, smbDomain = null, smbUsername = null, smbPassword = null,
            )
        }

        fun smb(
            host: String,
            share: String,
            port: Int? = null,
            path: String? = null,
            domain: String? = null,
            username: String? = null,
            password: String? = null,
        ): StorageConfig {
            val normalizedHost = host.trim()
            val normalizedShare = share.trim()
            val normalizedPath = path?.trim()?.takeIf { it.isNotBlank() }
            val normalizedDomain = domain?.trim()?.takeIf { it.isNotBlank() }
            val normalizedUsername = username?.trim()?.takeIf { it.isNotBlank() }

            require(normalizedHost.isNotBlank()) { "SMB host must not be blank" }
            require(normalizedShare.isNotBlank()) { "SMB share must not be blank" }
            require('/' !in normalizedShare && '\\' !in normalizedShare) {
                "SMB share must not contain path separators"
            }
            require(port == null || port in 1..65535) { "SMB port must be between 1 and 65535" }
            require(normalizedPath == null || normalizedPath.split('/', '\\').none { it == ".." }) {
                "SMB path must not contain path traversal segments"
            }

            return StorageConfig(
                type = StorageType.SMB,
                localPath = null,
                s3Bucket = null, s3Region = null, s3Endpoint = null,
                s3AccessKey = null, s3SecretKey = null,
                smbHost = normalizedHost, smbPort = port, smbShare = normalizedShare,
                smbPath = normalizedPath, smbDomain = normalizedDomain,
                smbUsername = normalizedUsername,
                smbPassword = if (normalizedUsername == null) null else password?.takeIf { it.isNotEmpty() },
            )
        }

        fun reconstitute(
            type: StorageType,
            localPath: String?,
            s3Bucket: String?,
            s3Region: String?,
            s3Endpoint: String?,
            s3AccessKey: String?,
            s3SecretKey: String?,
            smbHost: String? = null,
            smbPort: Int? = null,
            smbShare: String? = null,
            smbPath: String? = null,
            smbDomain: String? = null,
            smbUsername: String? = null,
            smbPassword: String? = null,
        ): StorageConfig =
            StorageConfig(
                type, localPath,
                s3Bucket, s3Region, s3Endpoint, s3AccessKey, s3SecretKey,
                smbHost, smbPort, smbShare, smbPath, smbDomain, smbUsername, smbPassword,
            )
    }
}
