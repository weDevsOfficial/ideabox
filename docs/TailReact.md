# Tail React: A Tailwind CSS + React Component Library

This repository contains a collection of reusable React components styled with Tailwind CSS. The components are designed to be easily integrated into your React projects, providing a consistent and visually appealing user interface.

## Installation

To use this component library in your project, you can install it via `npm` or `yarn`.

```bash
npm install @wedevs/tail-react
# or
yarn add @wedevs/tail-react
```

## Usage

On your `tailwind.config.js` file, update the content entry:

```diff
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
+    "node_modules/@wedevs/tail-react/dist/index.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [
+    import('@tailwindcss/forms'),
  ],
}
```

## Available Components

- Badge
- Button
- Checkbox
- ContextualHelp
- Dropdown
- Modal
- Notice
- Popover
- RadioGroup
- SelectCard
- SelectInput
- SwitchInput
- Table
- TextField
- Textarea
- Tooltip

## Props for Each Components

### Badge

```typescript
interface BadgeProps {
  label: React.ReactNode;
  type?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  className?: string;
  border?: boolean;
}
```

### Button

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: 'fill' | 'outline' | 'link';
  type?: 'button' | 'submit' | 'reset';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  as?: React.ElementType;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
}
```

### Checkbox

```typescript
interface CheckboxProps {
  label: string;
  checked?: boolean;
  className?: string;
  labelClassName?: string;
  help?: React.ReactNode;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}
```

### ContextualHelp

Usage

```typescript
import React from 'react';
import { ContextualHelp } from '@wedevs/tail-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <ContextualHelp>
        <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
        <p className="text-sm text-gray-500">
          If you're having trouble accessing your account, contact our customer support team for
          help.
        </p>
      </ContextualHelp>
    </div>
  );
};

export default App;
```

### Dropdown

It has two components, `<Dropdown />` and `<DropdownItem />`

```typescript
interface DropdownProps {
  button: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

interface DropdownItemProps {
  children: React.ReactNode;
  className?: string;
  activeClass?: string;
}
```

Example:

```typescript
import React from 'react';
import { Dropdown, DropdownItem } from '@wedevs/tail-react';

const MyComponent = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <Dropdown
        button={
          <button className="px-4 py-2 bg-blue-500 text-white rounded-md">Toggle Dropdown</button>
        }
        className="mx-4"
      >
        <DropdownItem onClick={() => console.log('Option 1')}>Option 1</DropdownItem>
        <DropdownItem onClick={() => console.log('Option 2')}>Option 2</DropdownItem>
        <DropdownItem onClick={() => console.log('Option 3')}>Option 3</DropdownItem>
      </Dropdown>
    </div>
  );
};

export default MyComponent;
```

### Modal

Modal has a few components:

- Modal
- ModalHeader
- ModalBody
- ModalActions

Props:

```typescript
export interface ModalProps {
  isOpen: boolean;
  onClose(): void;
  maxWidth?: string;
}
```

Example:

```typescript
import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalActions } from '@wedevs/tail-react';

const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  return (
    <div>
      <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={handleOpenModal}>
        Open Modal
      </button>

      <Modal isOpen={isOpen} onClose={handleCloseModal} maxWidth="lg">
        <ModalHeader>Modal Title</ModalHeader>
        <ModalBody>
          <p>This is the modal content.</p>
        </ModalBody>
        <ModalActions>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-md mr-2"
            onClick={handleCloseModal}
          >
            Cancel
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md"
            onClick={handleCloseModal}
          >
            Save
          </button>
        </ModalActions>
      </Modal>
    </div>
  );
};

export default App;
```

#### ConfirmModal

The `ConfirmModal` component is a reusable and customizable confirmation modal built on top of the Modal component. It provides a simple way to create a confirmation dialog with an optional icon, a title, a message, and action buttons for confirming or canceling an action.

Usage:

```typescript
import React, { useState } from 'react';
import { ConfirmModal } from '@wedevs/tail-react';

const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };

  const handleConfirmAction = () => {
    // Handle the confirmed action here
    console.log('Action confirmed');
    setIsOpen(false);
  };

  return (
    <div>
      <button className="bg-red-500 text-white px-4 py-2 rounded-md" onClick={handleOpenModal}>
        Delete Item
      </button>

      <ConfirmModal
        isOpen={isOpen}
        title="Confirm Delete"
        message="Are you sure you want to delete this item? This action cannot be undone."
        buttonVariant="danger"
        buttonLabel="Delete"
        onClose={handleCloseModal}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
};

export default App;
```

### Notice

```typescript
export interface NoticeProps {
  label?: React.ReactNode;
  type?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
  children?: React.ReactNode;
  dismissible?: boolean;
}
```

### Popover

```typescript
type Props = {
  trigger: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  sideOffset?: number;
  showCloseButton?: boolean;
  showArrow?: boolean;
  arrowClassName?: string;
  side: 'top' | 'right' | 'bottom' | 'left';
};
```

### RadioGroup

```typescript
interface RadioGroupProps {
  options: Option[];
  value: string;
  label?: string;
  help?: React.ReactNode;
  required?: boolean;
  onChange: (value: string) => void;
}
```

Example:

```typescript
import { useState } from 'react';
import { RadioGroup } from './RadioGroup';

const RadioExample = () => {
  const [radio, setRadio] = useState('option1');

  return (
    <div className="">
      <h1 className="text-2xl font-semibold border-b pb-4 mb-8">Radio Group</h1>

      <RadioGroup
        label="Notifications"
        required={true}
        value={radio}
        help="How do you prefer to receive notifications?"
        options={[
          { value: 'Email', key: 'option1' },
          { value: 'SMS', key: 'option2' },
          { value: 'Push notification', key: 'option3' },
        ]}
        onChange={(selectedOption) => setRadio(selectedOption)}
      />
    </div>
  );
};

export default RadioExample;
```

### SelectCard


```typescript
interface SelectCardProps {
  label?: string;
  help?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  options: Option[];
  selectedKey?: string;
  className?: string;
  onChange?: (selectedOption: Option) => void;
  renderItem: (option: Option) => React.JSX.Element;
}
```

Example:

```typescript
<SelectCard
  label="Select an option"
  onChange={function Ya(){}}
  options={[
    {
      key: 'option1',
      value: 'Option 1'
    },
    {
      key: 'option2',
      value: 'Option 2'
    },
    {
      key: 'option3',
      value: 'Option 3'
    },
    {
      key: 'option4',
      value: 'Option 4'
    }
  ]}
  renderItem: (item) => item.value,
  selectedKey="option2"
/>
```

### SelectInput

```typescript
interface SelectProps {
  label?: string;
  help?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  options: Option[];
  selectedKey?: string;
  className?: string;
  wrapperClassName?: string;
  onChange?: (selectedOption: Option) => void;
  props?: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
}
```

Example:

```typescript
<SelectInput
  label="Select an option"
  onChange={function Ya(){}}
  options={[
    {
      key: 'option1',
      value: 'Option 1'
    },
    {
      key: 'option2',
      value: 'Option 2'
    },
    {
      key: 'option3',
      value: 'Option 3'
    },
    {
      key: 'option4',
      value: 'Option 4'
    }
  ]}
/>
```

### SwitchInput

The `SwitchInput` component is a customizable and accessible switch input built with React and Tailwind CSS. It allows you to create interactive toggle switches for various settings or options in your application.

Props:

```typescript
type Props = {
  label: string;
  initialValue?: boolean;
  help?: ReactNode;
  disabled?: boolean;
  html?: boolean;
  className?: string;
  onChange?: (status: boolean) => void;
};
```

Usage:

Once installed, you can import and use the `SwitchInput` component in your React application as follows:

```jsx
import React, { useState } from 'react';
import { SwitchInput } from '@wedevs/tail-react';

const App = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  const handleToggle = (status) => {
    setIsEnabled(status);
    // Your custom logic here when the switch is toggled
  };

  return (
    <div>
      <SwitchInput
        label="Enable Feature"
        initialValue={isEnabled}
        onChange={handleToggle}
        help="Toggle to enable or disable the feature"
      />
    </div>
  );
};

export default App;
```

### Table

The `Table` component is a reusable and customizable table element for React applications, designed to work seamlessly with Tailwind CSS.

The `Table` component library consists of three main components: `Table`, `TableHeader`, and `TableBody`.

**Table Props:** 

- `children` (React.ReactNode, required): The content of the table, including `TableHeader` and `TableBody` components.

- `className` (string, optional): Additional CSS classes to be applied to the table.

- `loading` (boolean, optional): If true, the table will display a loading message while waiting for data to load.

**TableHeader Props:**

- `children` (React.ReactNode, required): The content of the table header, typically `th` elements.

- `className` (string, optional): Additional CSS classes to be applied to the table header.

**TableBody Props:**

- `items` (T[], required): An array of objects representing the rows of the table.

- `renderRow` ((item: T) => React.ReactNode, required): A callback function that renders each row of the table based on the item data.

- `className` (string, optional): Additional CSS classes to be applied to the table body.


**Example:**


```jsx
import React from 'react';
import { Table, TableHeader, TableBody } from '@wedevs/tail-react';

interface User {
  id: number;
  name: string;
  age: number;
}

const rows: User[] = [
  { id: 1, name: 'John Doe', age: 30 },
  { id: 2, name: 'Jane Smith', age: 28 },
  { id: 3, name: 'Bob Johnson', age: 35 },
];

const MyComponent = () => {
  return (
    <Table>
      <TableHeader>
        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          ID
        </th>
        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Name
        </th>
        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Age
        </th>
      </TableHeader>
      <TableBody
        items={rows}
        renderRow={(item: User) => (
          <>
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
              {item.id}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.name}</td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.age}</td>
          </>
        )}
      />
    </Table>
  );
};

export default MyComponent;
```

### TextField

```typescript
interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  help?: React.ReactNode;
  error?: React.ReactNode;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  placeholder?: string;
  name?: string;
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
  contextualHelp?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  inputWrapperClassName?: string;
  addon?: React.ReactNode;
  trailingAddon?: React.ReactNode;
  onChange: (value: string) => void;
}
```

### Textarea

```typescript
interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  help?: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  required?: boolean;
  rows?: number;
  error?: React.ReactNode;
  onChange?: (value: string) => void;
}
```

### Tooltip

```typescript
interface TooltipProps {
  content: ReactNode | string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  arrowClassName?: string;
  offset?: number;
}
```