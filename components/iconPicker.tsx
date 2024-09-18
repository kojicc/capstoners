import React, { useState } from 'react';
import * as TablerIcons from '@tabler/icons-react';
import { Modal, TextInput, Grid, Button } from '@mantine/core';

const allIcons = Object.keys(TablerIcons) as Array<keyof typeof TablerIcons>; // Add type assertion

type IconPickerProps = {
  onIconSelect: (iconName: string) => void;
};

const IconPicker = ({ onIconSelect }: IconPickerProps) => {
  const [opened, setOpened] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter icons based on the search term
  const filteredIcons = allIcons.filter((iconName) =>
    iconName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Button onClick={() => setOpened(true)}>Choose Icon</Button>
      <Modal opened={opened} onClose={() => setOpened(false)} title="Select an Icon" size="lg">
        <TextInput
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
        />
        <Grid mt="md">
          {filteredIcons.map((iconName) => {
            const IconComponent = TablerIcons[iconName];
            return (
              <Grid.Col key={iconName} span={2}>
                <Button
                  variant="outline"
                  onClick={() => {
                    onIconSelect(iconName);
                    setOpened(false);
                  }}
                  style={{ display: 'flex', justifyContent: 'center' }}
                >
                  {/* Render the IconComponent properly */}
                  {React.createElement(IconComponent as React.ElementType, { size: 32 })}
                </Button>
              </Grid.Col>
            );
          })}
        </Grid>
      </Modal>
    </>
  );
};

export default IconPicker;
