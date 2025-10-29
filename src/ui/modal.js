// Function to create and show a modal
export function showModal(title, content) {
  // Check if a modal already exists and remove it
  const existingModal = document.querySelector(".modal-backdrop");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal backdrop
  const backdrop = document.createElement("div");
  backdrop.className =
    "modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center";
  backdrop.onclick = (e) => {
    if (e.target === backdrop) {
      backdrop.remove();
    }
  };


  // Create modal panel im Card-Design
  const modal = document.createElement("div");
  modal.className = "bg-white border border-gray-200 rounded-xl shadow-lg w-full max-w-xl max-h-[80vh] overflow-y-auto flex flex-col";

  // Card-Header
  const header = document.createElement("div");
  header.className = "flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-xl";
  const titleEl = document.createElement("h3");
  titleEl.className = "text-lg font-bold text-gray-700 tracking-tight";
  titleEl.innerHTML = title;
  const closeBtn = document.createElement("button");
  closeBtn.className = "text-gray-400 hover:text-blue-500 transition-colors text-xl";
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  closeBtn.onclick = () => backdrop.remove();
  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  // Card-Body
  const body = document.createElement("div");
  body.className = "px-6 py-4 text-gray-700 text-base";
  body.innerHTML = content;

  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(body);
  backdrop.appendChild(modal);

  // Add to body
  document.body.appendChild(backdrop);
}
