import React, { useState } from 'react';
import {
  Button,
  TextField,
  Modal,
  ModalHeader,
  ModalBody,
  ModalActions,
  Checkbox,
} from '@wedevs/tail-react';
import { XMarkIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/solid';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { Bars3Icon } from '@heroicons/react/24/outline';

interface Link {
  label: string;
  href: string;
  is_external: boolean;
}

interface LinkManagerProps {
  value: Link[] | null;
  onChange: (value: Link[]) => void;
}

export default function LinkManager({ value, onChange }: LinkManagerProps) {
  const [links, setLinks] = useState<Link[]>(value || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState<Link | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Update the parent component when links change
  const updateLinks = (newLinks: Link[]) => {
    setLinks(newLinks);
    onChange(newLinks);
  };

  // Add a new link
  const addLink = () => {
    setCurrentLink({ label: '', href: '', is_external: false });
    setEditIndex(null);
    setIsModalOpen(true);
  };

  // Edit an existing link
  const editLink = (index: number) => {
    setCurrentLink({ ...links[index] });
    setEditIndex(index);
    setIsModalOpen(true);
  };

  // Remove a link
  const removeLink = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    updateLinks(newLinks);
  };

  // Handle drag end event
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    updateLinks(items);
  };

  // Save link from modal
  const saveLink = () => {
    if (!currentLink) return;

    const newLinks = [...links];
    if (editIndex !== null) {
      // Edit existing link
      newLinks[editIndex] = currentLink;
    } else {
      // Add new link
      newLinks.push(currentLink);
    }

    updateLinks(newLinks);
    setIsModalOpen(false);
    setCurrentLink(null);
    setEditIndex(null);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Links</h3>
        <Button
          size="small"
          variant="secondary"
          onClick={addLink}
          className="flex items-center gap-1 px-2 py-1"
        >
          <PlusIcon className="h-3 w-3" />
          <span>Add New</span>
        </Button>
      </div>

      {links.length === 0 ? (
        <p className="text-sm italic text-gray-500">No links added yet.</p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="links">
            {(provided) => (
              <ul
                className="space-y-2 rounded bg-gray-50 p-3 dark:bg-gray-900"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {links.map((link, index) => (
                  <Draggable
                    key={index}
                    draggableId={`link-${index}`}
                    index={index}
                  >
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center justify-between rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div className="flex items-center">
                          <div
                            {...provided.dragHandleProps}
                            className="mr-2 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing"
                          >
                            <Bars3Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {link.label}
                            </div>
                            <div className="max-w-md truncate font-mono text-sm text-gray-500">
                              {link.href}
                              {link.is_external && (
                                <span className="ml-1 text-xs italic">
                                  (external)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => editLink(index)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLink(index)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Link edit modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          {editIndex !== null ? 'Edit Link' : 'Add New Link'}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <TextField
                label="Label"
                value={currentLink?.label || ''}
                onChange={(value) =>
                  setCurrentLink((prev) =>
                    prev ? { ...prev, label: value } : null,
                  )
                }
                placeholder="e.g. Terms of Service"
              />
            </div>
            <div>
              <TextField
                label="URL"
                value={currentLink?.href || ''}
                onChange={(value) =>
                  setCurrentLink((prev) =>
                    prev ? { ...prev, href: value } : null,
                  )
                }
                placeholder="e.g. /terms or https://example.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                label="External link (opens in new tab)"
                checked={currentLink?.is_external || false}
                onChange={(checked) =>
                  setCurrentLink((prev) =>
                    prev ? { ...prev, is_external: checked } : null,
                  )
                }
              />
            </div>
          </div>
        </ModalBody>
        <ModalActions>
          <Button
            variant="primary"
            onClick={saveLink}
            disabled={!currentLink?.label || !currentLink.href}
          >
            Save
          </Button>
          <Button
            variant="secondary"
            className="mr-2"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </Button>
        </ModalActions>
      </Modal>
    </div>
  );
}
