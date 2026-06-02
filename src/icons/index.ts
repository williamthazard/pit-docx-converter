// Centralized Ionicons setup. Icons are registered with addIcons so they are
// bundled locally (no network fetch) and referenced by name via <ion-icon>.
import { addIcons } from 'ionicons'
import {
  cloudUploadOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  codeSlashOutline,
  clipboardOutline,
  downloadOutline,
  warningOutline,
  informationCircleOutline,
} from 'ionicons/icons'

export const setupIcons = () => {
  addIcons({
    'cloud-upload-outline': cloudUploadOutline,
    'checkmark-circle-outline': checkmarkCircleOutline,
    'checkmark-outline': checkmarkOutline,
    'code-slash-outline': codeSlashOutline,
    'clipboard-outline': clipboardOutline,
    'download-outline': downloadOutline,
    'warning-outline': warningOutline,
    'information-circle-outline': informationCircleOutline,
  })
}
