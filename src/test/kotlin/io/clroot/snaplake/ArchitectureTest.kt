package io.clroot.snaplake

import com.tngtech.archunit.core.importer.ClassFileImporter
import com.tngtech.archunit.core.importer.ImportOption
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses
import com.tngtech.archunit.library.Architectures.layeredArchitecture
import io.kotest.core.spec.style.DescribeSpec

class ArchitectureTest :
    DescribeSpec({

        val classes =
            ClassFileImporter()
                .withImportOption(ImportOption.DoNotIncludeTests())
                .importPackages("io.clroot.snaplake")

        describe("레이어 의존성") {
            it("domain → application, adapter, config 의존 금지") {
                noClasses()
                    .that()
                    .resideInAPackage("io.clroot.snaplake.domain..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage(
                        "io.clroot.snaplake.application..",
                        "io.clroot.snaplake.adapter..",
                        "io.clroot.snaplake.config..",
                    ).check(classes)
            }

            it("application → adapter 의존 금지") {
                noClasses()
                    .that()
                    .resideInAPackage("io.clroot.snaplake.application..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAPackage("io.clroot.snaplake.adapter..")
                    .check(classes)
            }

            it("layered architecture 검증") {
                layeredArchitecture()
                    .consideringOnlyDependenciesInLayers()
                    .layer("Domain")
                    .definedBy("io.clroot.snaplake.domain..")
                    .layer("Application")
                    .definedBy("io.clroot.snaplake.application..")
                    .layer("Adapter")
                    .definedBy("io.clroot.snaplake.adapter..")
                    .layer("Config")
                    .definedBy("io.clroot.snaplake.config..")
                    .whereLayer("Domain")
                    .mayOnlyBeAccessedByLayers("Application", "Adapter", "Config")
                    .whereLayer("Application")
                    .mayOnlyBeAccessedByLayers("Adapter", "Config")
                    // Config는 composition root이므로 Adapter 참조 허용
                    .whereLayer("Adapter")
                    .mayOnlyBeAccessedByLayers("Config")
                    .check(classes)
            }
        }

        describe("domain 프레임워크 격리") {
            it("domain은 Spring에 의존하지 않는다") {
                noClasses()
                    .that()
                    .resideInAPackage("io.clroot.snaplake.domain..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAPackage("org.springframework..")
                    .check(classes)
            }

            it("domain은 JPA/Hibernate에 의존하지 않는다") {
                noClasses()
                    .that()
                    .resideInAPackage("io.clroot.snaplake.domain..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage(
                        "jakarta.persistence..",
                        "org.hibernate..",
                    ).check(classes)
            }
        }

        describe("application port 격리") {
            it("inbound port는 외부 프레임워크에 의존하지 않는다") {
                noClasses()
                    .that()
                    .resideInAPackage("io.clroot.snaplake.application.port..")
                    .should()
                    .dependOnClassesThat()
                    .resideInAnyPackage(
                        "org.springframework..",
                        "jakarta.persistence..",
                    ).check(classes)
            }
        }
    })
