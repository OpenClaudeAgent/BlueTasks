package com.bluetasks.mobile.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.bluetasks.mobile.generated.Res
import com.bluetasks.mobile.generated.task_done
import com.bluetasks.mobile.generated.task_open_content_desc
import com.bluetasks.mobile.generated.task_pin
import com.bluetasks.mobile.generated.task_time_spent
import com.bluetasks.mobile.generated.task_undo
import com.bluetasks.mobile.shared.api.ApiTaskRow
import com.bluetasks.mobile.shared.api.TaskStatus
import com.bluetasks.mobile.shared.domain.formatDurationHms
import com.bluetasks.mobile.shared.domain.totalDisplayedTimeSpentSeconds
import com.bluetasks.mobile.ui.theme.BlueTasksColors
import com.composables.icons.lucide.Check
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.Pin
import com.composables.icons.lucide.Undo2
import kotlinx.datetime.Instant
import org.jetbrains.compose.resources.stringResource

@Composable
public fun TaskRowCard(
    task: ApiTaskRow,
    now: Instant,
    onOpen: () -> Unit,
    onToggleDone: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val openDesc = stringResource(Res.string.task_open_content_desc)
    val pinDesc = stringResource(Res.string.task_pin)
    val cardA11y =
        if (task.pinned) {
            "$openDesc. $pinDesc"
        } else {
            openDesc
        }
    val totalSec = totalDisplayedTimeSpentSeconds(task.timeSpentSeconds, task.timerStartedAt, now)
    val timerLine =
        if (totalSec > 0 || task.timerStartedAt != null) {
            stringResource(Res.string.task_time_spent, formatDurationHms(totalSec))
        } else {
            null
        }
    val cardShape = MaterialTheme.shapes.large
    Card(
        modifier =
            modifier
                .fillMaxWidth()
                .semantics { contentDescription = cardA11y }
                .clip(cardShape)
                .clickable(onClick = onOpen),
        colors =
            CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.onSurface,
            ),
        border = BorderStroke(1.dp, BlueTasksColors.BorderSubtle),
        shape = cardShape,
    ) {
        Row(
            Modifier.padding(12.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (task.pinned) {
                        Icon(
                            imageVector = Lucide.Pin,
                            contentDescription = null,
                            modifier = Modifier.size(17.dp),
                            tint = BlueTasksColors.Accent,
                        )
                    }
                    Text(
                        task.title,
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.weight(1f, fill = false),
                    )
                }
                task.taskDate?.let {
                    Text(
                        it,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                timerLine?.let {
                    Text(
                        it,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            TextButton(onClick = onToggleDone) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(
                        imageVector =
                            if (task.status == TaskStatus.completed) {
                                Lucide.Undo2
                            } else {
                                Lucide.Check
                            },
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                    )
                    Text(
                        if (task.status == TaskStatus.completed) {
                            stringResource(Res.string.task_undo)
                        } else {
                            stringResource(Res.string.task_done)
                        },
                    )
                }
            }
        }
    }
}
