package com.bluetasks.mobile.ui.components

import androidx.compose.ui.graphics.vector.ImageVector
import com.bluetasks.mobile.shared.domain.SECTION_ALL
import com.bluetasks.mobile.shared.domain.SECTION_ANYTIME
import com.bluetasks.mobile.shared.domain.SECTION_DONE
import com.bluetasks.mobile.shared.domain.SECTION_TODAY
import com.bluetasks.mobile.shared.domain.SECTION_UPCOMING
import com.composables.icons.lucide.Calendar
import com.composables.icons.lucide.CalendarClock
import com.composables.icons.lucide.CalendarOff
import com.composables.icons.lucide.CheckCheck
import com.composables.icons.lucide.ListChecks
import com.composables.icons.lucide.Lucide

/** Matches web sidebar section icons (`sectionIcons`). */
public fun sectionNavIcon(sectionId: String): ImageVector =
    when (sectionId) {
        SECTION_TODAY -> Lucide.Calendar
        SECTION_UPCOMING -> Lucide.CalendarClock
        SECTION_ANYTIME -> Lucide.CalendarOff
        SECTION_DONE -> Lucide.CheckCheck
        SECTION_ALL -> Lucide.ListChecks
        else -> Lucide.Calendar
    }
