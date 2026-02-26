package io.clroot.snaplake.adapter.inbound.scheduler

import io.clroot.snaplake.application.port.inbound.RecoverOrphanedSnapshotsUseCase
import io.kotest.core.spec.style.DescribeSpec
import io.mockk.clearAllMocks
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify

class SnapshotRecoveryAdapterTest :
    DescribeSpec({

        val recoverUseCase = mockk<RecoverOrphanedSnapshotsUseCase>()
        val sut = SnapshotRecoveryAdapter(recoverUseCase)

        beforeTest {
            clearAllMocks()
        }

        describe("onApplicationReady") {
            it("recoverAll을 호출한다") {
                every { recoverUseCase.recoverAll() } returns 3

                sut.onApplicationReady()

                verify(exactly = 1) { recoverUseCase.recoverAll() }
            }
        }

        describe("recoverStaleSnapshots") {
            it("recoverStale을 호출한다") {
                every { recoverUseCase.recoverStale() } returns 1

                sut.recoverStaleSnapshots()

                verify(exactly = 1) { recoverUseCase.recoverStale() }
            }
        }
    })
