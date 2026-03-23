package com.bluetasks.mobile.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.bluetasks.mobile.generated.Res
import com.bluetasks.mobile.generated.filter_all
import com.bluetasks.mobile.generated.filter_none
import com.bluetasks.mobile.shared.api.ApiCategoryRow
import com.bluetasks.mobile.shared.domain.FILTER_CATEGORY_ALL
import com.bluetasks.mobile.shared.domain.FILTER_CATEGORY_UNCATEGORIZED
import com.bluetasks.mobile.ui.theme.BlueTasksFilterChipTokens
import com.composables.icons.lucide.Folder
import com.composables.icons.lucide.Layers
import com.composables.icons.lucide.Lucide
import org.jetbrains.compose.resources.stringResource

@Composable
public fun CategoryChipsRow(
    categories: List<ApiCategoryRow>,
    selected: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val chipShape = BlueTasksFilterChipTokens.shape
    val chipColors = BlueTasksFilterChipTokens.colors()
    LazyRow(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        contentPadding = PaddingValues(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        item {
            FilterChip(
                selected = selected == FILTER_CATEGORY_ALL,
                onClick = { onSelect(FILTER_CATEGORY_ALL) },
                leadingIcon = {
                    Icon(
                        Lucide.Layers,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                },
                label = { Text(stringResource(Res.string.filter_all)) },
                shape = chipShape,
                colors = chipColors,
                border = BlueTasksFilterChipTokens.border(selected = selected == FILTER_CATEGORY_ALL),
            )
        }
        item {
            FilterChip(
                selected = selected == FILTER_CATEGORY_UNCATEGORIZED,
                onClick = { onSelect(FILTER_CATEGORY_UNCATEGORIZED) },
                leadingIcon = {
                    Icon(
                        Lucide.Folder,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                },
                label = { Text(stringResource(Res.string.filter_none)) },
                shape = chipShape,
                colors = chipColors,
                border = BlueTasksFilterChipTokens.border(selected = selected == FILTER_CATEGORY_UNCATEGORIZED),
            )
        }
        items(
            items = categories,
            key = { it.id },
        ) { c ->
            FilterChip(
                selected = selected == c.id,
                onClick = { onSelect(c.id) },
                leadingIcon = {
                    Icon(
                        categoryIconVector(c.icon),
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                },
                label = { Text(c.name) },
                shape = chipShape,
                colors = chipColors,
                border = BlueTasksFilterChipTokens.border(selected = selected == c.id),
            )
        }
    }
}
