import { toast } from 'react-toastify';

class ToastService {
  success(message, options = {}) {
    toast.success(message, {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  error(message, options = {}) {
    toast.error(message, {
      position: "bottom-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  warning(message, options = {}) {
    toast.warning(message, {
      position: "bottom-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  info(message, options = {}) {
    toast.info(message, {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  }

  loading(message, options = {}) {
    return toast.loading(message, {
      position: "bottom-right",
      ...options
    });
  }

  update(toastId, message, type = 'success', options = {}) {
    toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      autoClose: 3000,
      ...options
    });
  }

  dismiss(toastId) {
    toast.dismiss(toastId);
  }

  dismissAll() {
    toast.dismiss();
  }
}

export default new ToastService();
