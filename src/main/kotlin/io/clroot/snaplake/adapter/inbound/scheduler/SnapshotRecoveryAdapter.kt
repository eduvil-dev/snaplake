package io.clroot.snaplake.adapter.inbound.scheduler

import io.clroot.snaplake.application.port.inbound.RecoverOrphanedSnapshotsUseCase
import org.slf4j.LoggerFactory
import org.springframework.boot.context.event.ApplicationReadyEvent
import org.springframework.context.event.EventListener
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class SnapshotRecoveryAdapter(
    private val recoverOrphanedSnapshotsUseCase: RecoverOrphanedSnapshotsUseCase,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    @EventListener(ApplicationReadyEvent::class)
    fun onApplicationReady() {
        val count = recoverOrphanedSnapshotsUseCase.recoverAll()
        if (count > 0) {
            log.warn("Recovered {} orphaned RUNNING snapshot(s) on startup", count)
        }
    }

    @Scheduled(fixedRate = 5 * 60 * 1000)
    fun recoverStaleSnapshots() {
        val count = recoverOrphanedSnapshotsUseCase.recoverStale()
        if (count > 0) {
            log.warn("Recovered {} stale RUNNING snapshot(s)", count)
        }
    }
}
