import io.clroot.gradle.bun.task.BunTask
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    kotlin("jvm") version "2.3.21"
    kotlin("plugin.spring") version "2.3.21"
    kotlin("plugin.jpa") version "2.3.21"
    id("org.springframework.boot") version "4.1.0"
    id("io.spring.dependency-management") version "1.1.7"
    id("io.clroot.gradle-bun") version "0.1.0"
}

group = "io.clroot.snaplake"
version = "0.1.0-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_25
    targetCompatibility = JavaVersion.VERSION_25
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

bun {
    version = "1.4.0"
    workingDir = layout.projectDirectory.dir("frontend")
}

dependencies {
    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework:spring-aop")
    implementation("org.aspectj:aspectjweaver")

    // Kotlin
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // SQLite
    implementation("org.xerial:sqlite-jdbc:3.53.4.0")
    implementation("org.hibernate.orm:hibernate-community-dialects")

    // Liquibase
    implementation("org.springframework.boot:spring-boot-starter-liquibase")

    // DuckDB
    implementation("org.duckdb:duckdb_jdbc:1.5.5.1")

    // JWT
    implementation("io.jsonwebtoken:jjwt-api:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.13.0")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.13.0")

    // S3
    implementation(platform("software.amazon.awssdk:bom:2.31.9"))
    implementation("software.amazon.awssdk:s3")

    // SMB
    implementation("com.hierynomus:smbj:0.15.0")

    // PostgreSQL + MySQL JDBC
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("com.mysql:mysql-connector-j")

    // Encryption
    implementation("org.bouncycastle:bcprov-jdk18on:1.81")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.springframework.security:spring-security-test")
    testImplementation("io.kotest:kotest-runner-junit5:6.1.3")
    testImplementation("io.kotest:kotest-assertions-core:6.1.3")
    testImplementation("io.kotest:kotest-extensions-spring:6.1.3")
    testImplementation("io.mockk:mockk:1.14.7")
    testImplementation("com.tngtech.archunit:archunit:1.4.1")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
        jvmTarget.set(JvmTarget.JVM_25)
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    systemProperty("snaplake.encryption.key", "test-encryption-key-for-unit-tests")
}

tasks.withType<Jar> {
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

val buildFrontend by tasks.registering(BunTask::class) {
    dependsOn("bunInstall")
    args("run", "build")
    inputs.dir("frontend/src")
    inputs.files(
        "frontend/index.html",
        "frontend/vite.config.ts",
        "frontend/tsconfig.json",
        "frontend/tsconfig.app.json",
    )
    outputs.dir("src/main/resources/static")
}

tasks.named("processResources") {
    mustRunAfter(buildFrontend)
}

tasks.named("bootJar") {
    dependsOn(buildFrontend)
}

tasks.named("bootRun") {
    dependsOn(buildFrontend)
}
