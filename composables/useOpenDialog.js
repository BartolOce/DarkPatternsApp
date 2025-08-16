import { onMounted, watch } from 'vue'

/**
 * Handles showing and closing a native <dialog> element
 * when `props.open` changes, and ensures it opens
 * immediately if mounted with `open=true`.
 *
 * @param {Object} props - Component props object
 * @param {Ref} dialogRef - Ref pointing to the <dialog> element
 * @param {Function} [onOpen] - Optional callback when opened
 */
export function useOpenDialog(props, dialogRef, onOpen) {
  onMounted(() => {
    if (props.open && dialogRef.value) {
      dialogRef.value.showModal()
      if (onOpen) onOpen()
    }
  })

  watch(
    () => props.open,
    (val) => {
      if (!dialogRef.value) return
      if (val) {
        dialogRef.value.showModal()
        if (onOpen) onOpen()
      } else {
        dialogRef.value.close()
      }
    }
  )
}
