package com.bluetasks.mobile.ui.components

import androidx.compose.ui.graphics.vector.ImageVector
import com.composables.icons.lucide.BookOpen
import com.composables.icons.lucide.Briefcase
import com.composables.icons.lucide.Building2
import com.composables.icons.lucide.Camera
import com.composables.icons.lucide.Car
import com.composables.icons.lucide.Code
import com.composables.icons.lucide.Coffee
import com.composables.icons.lucide.Dumbbell
import com.composables.icons.lucide.Flag
import com.composables.icons.lucide.Folder
import com.composables.icons.lucide.Gamepad2
import com.composables.icons.lucide.Heart
import com.composables.icons.lucide.House
import com.composables.icons.lucide.Lightbulb
import com.composables.icons.lucide.Lucide
import com.composables.icons.lucide.Music
import com.composables.icons.lucide.Palette
import com.composables.icons.lucide.Plane
import com.composables.icons.lucide.ShoppingBag
import com.composables.icons.lucide.Sparkles
import com.composables.icons.lucide.Star
import com.composables.icons.lucide.Target
import com.composables.icons.lucide.Users
import com.composables.icons.lucide.Zap

/**
 * Same Lucide set as [web/app/src/lib/categoryIcons.ts](web/app/src/lib/categoryIcons.ts).
 * The `com.composables:icons-lucide` pack names the home glyph [Lucide.House] (no separate `Home` file).
 */
public fun categoryIconVector(iconId: String): ImageVector =
    when (iconId) {
        "folder" -> Lucide.Folder
        "briefcase" -> Lucide.Briefcase
        "home" -> Lucide.House
        "heart" -> Lucide.Heart
        "code" -> Lucide.Code
        "coffee" -> Lucide.Coffee
        "star" -> Lucide.Star
        "flag" -> Lucide.Flag
        "target" -> Lucide.Target
        "zap" -> Lucide.Zap
        "book" -> Lucide.BookOpen
        "music" -> Lucide.Music
        "camera" -> Lucide.Camera
        "gamepad" -> Lucide.Gamepad2
        "shopping" -> Lucide.ShoppingBag
        "users" -> Lucide.Users
        "building" -> Lucide.Building2
        "plane" -> Lucide.Plane
        "car" -> Lucide.Car
        "dumbbell" -> Lucide.Dumbbell
        "lightbulb" -> Lucide.Lightbulb
        "palette" -> Lucide.Palette
        "sparkles" -> Lucide.Sparkles
        else -> Lucide.Folder
    }
