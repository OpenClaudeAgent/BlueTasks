package com.bluetasks.mobile

public sealed class AppEffect {
    public data class ShareSqlite(
        val bytes: ByteArray,
        val filename: String,
    ) : AppEffect() {
        override fun equals(other: Any?): Boolean {
            if (this === other) return true
            if (other == null || this::class != other::class) return false
            other as ShareSqlite
            if (!bytes.contentEquals(other.bytes)) return false
            if (filename != other.filename) return false
            return true
        }

        override fun hashCode(): Int {
            var result = bytes.contentHashCode()
            result = 31 * result + filename.hashCode()
            return result
        }
    }

    public data object LaunchImportPicker : AppEffect()
}
