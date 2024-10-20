import {
  Button,
  Flex,
  Group,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Select,
  Title,
  ActionIcon,
  Tooltip,
  Checkbox,
} from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconTrash, IconEdit } from '@tabler/icons-react';
import axios from '@/utils/axiosInstance';
import useSWR, { mutate } from 'swr';
import { SetStateAction, useState } from 'react';
import { notifications } from '@mantine/notifications';

interface ClassSchedule {
  class_section: string;
  class_name: string;
  class_days: {
    [day: string]: {
      start: string;
      end: string;
    }[];
  };
  class_instructor: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function ClassroomCrud() {
  // #region State
  const [classSchedule, setClassSchedule] = useState<ClassSchedule[]>([]);
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [classSection, setClassSection] = useState('');
  const [className, setClassName] = useState('');
  const [classDays, setClassDays] = useState<{ [key: string]: { start: string; end: string }[] }>(
    {}
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [classInstructor, setClassInstructor] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<{ day: string; index: number } | null>(null);
  const [checkedTimes, setCheckedTimes] = useState<{ [key: string]: boolean }>({});
  const [enableAddTime, setEnableAddTime] = useState(false);
  const [enableEditTime, setEnableEditTime] = useState(true);
  const [enabledClassDaySelect, setEnabledClassDaySelect] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    classSection: string;
    day?: string;
    index?: number;
  } | null>(null);
  // #endregion

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      const { classSection, day, index } = itemToDelete;
      if (day !== undefined && index !== undefined) {
        await handleRemoveTime(day, index);
      } else {
        await handleRemoveClassSection(classSection);
      }
      setDeleteModalOpened(false);
      setItemToDelete(null);
    }
  };

  const convertTimeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes; // Convert time to total minutes since 00:00
  };

  const handleAddTime = () => {
    if (selectedDay && startTime && endTime) {
      // Convert startTime and endTime to minutes
      const startInMinutes = convertTimeToMinutes(startTime);
      const endInMinutes = convertTimeToMinutes(endTime);
      const durationInMinutes = endInMinutes - startInMinutes;

      // Ensure the time duration is at least 1 hour (60 minutes)
      if (durationInMinutes < 60) {
        notifications.show({
          title: 'Invalid Time Duration',
          message: 'The time duration must be at least 1 hour.',
          color: 'red',
        });
        return; // Prevent further execution if time is less than 1 hour
      }

      setClassDays((prev) => {
        const times = prev[selectedDay] || [];

        // Check for overlap (new start/end should not overlap with any existing interval)
        const isOverlapping = times.some((time) => {
          const existingStartInMinutes = convertTimeToMinutes(time.start);
          const existingEndInMinutes = convertTimeToMinutes(time.end);

          // Check if the new time range overlaps with an existing time range
          return (
            (startInMinutes >= existingStartInMinutes && startInMinutes < existingEndInMinutes) || // New start falls within an existing range
            (endInMinutes > existingStartInMinutes && endInMinutes <= existingEndInMinutes) || // New end falls within an existing range
            (startInMinutes <= existingStartInMinutes && endInMinutes >= existingEndInMinutes) // New range fully contains an existing range
          );
        });

        // If there is no overlap, add the new time
        if (!isOverlapping) {
          return {
            ...prev,
            [selectedDay]: [...times, { start: startTime, end: endTime }],
          };
        }

        // Notify if there's an overlap
        notifications.show({
          title: 'Time Overlap',
          message: 'The time overlaps with an existing time slot.',
          color: 'red',
        });

        // Return the current state without changes
        return prev;
      });

      // Clear inputs
      setSelectedDay(null);
      setStartTime('');
      setEndTime('');
    }
  };

  const handleUpdateTime = () => {
    if (selectedDay && startTime && endTime && selectedRow) {
      const { day, index } = selectedRow;
      const startInMinutes = convertTimeToMinutes(startTime);
      const endInMinutes = convertTimeToMinutes(endTime);
      const durationInMinutes = endInMinutes - startInMinutes;

      // Ensure the time duration is at least 1 hour (60 minutes)
      if (durationInMinutes < 60) {
        notifications.show({
          title: 'Invalid Time Duration',
          message: 'The time duration must be at least 1 hour.',
          color: 'red',
        });
        return; // Prevent further execution if time is less than 1 hour
      }

      setClassDays((prev) => {
        const times = prev[day].map((time, i) =>
          i === index ? { start: startTime, end: endTime } : time
        );

        // Check for overlap (new start/end should not overlap with any existing interval)
        const isOverlapping = times.some((time, i) => {
          if (i === index) return false; // Skip the current time being updated
          const existingStartInMinutes = convertTimeToMinutes(time.start);
          const existingEndInMinutes = convertTimeToMinutes(time.end);

          // Check if the new time range overlaps with an existing time range
          return (
            (startInMinutes >= existingStartInMinutes && startInMinutes < existingEndInMinutes) || // New start falls within an existing range
            (endInMinutes > existingStartInMinutes && endInMinutes <= existingEndInMinutes) || // New end falls within an existing range
            (startInMinutes <= existingStartInMinutes && endInMinutes >= existingEndInMinutes) // New range fully contains an existing range
          );
        });

        // If there is no overlap, update the time
        if (!isOverlapping) {
          return {
            ...prev,
            [day]: times,
          };
        }

        // Notify if there's an overlap
        notifications.show({
          title: 'Time Overlap',
          message: 'The time overlaps with an existing time slot.',
          color: 'red',
        });

        // Return the current state without changes
        return prev;
      });

      // Clear inputs
      setSelectedDay(null);
      setStartTime('');
      setEndTime('');
      setSelectedRow(null);
      setCheckedTimes({});
      setEnableEditTime(true);
      setEnabledClassDaySelect(false);
    }
  };

  // const handleRemoveTime = async (day: string, index: number) => {
  //   const time = classDays[day][index];
  //   console.log('Removing time:', time, 'Class section:', classSection);

  //   try {
  //     if (!day) {
  //       // Remove the entire class section if no class day is given
  //       await axios.delete('classScheduleCRUD/', {
  //         data: {
  //           class_section: classSection,
  //         },
  //       });
  //     } else {
  //       // Remove the specific time entry
  //       await axios.delete('classScheduleCRUD/', {
  //         data: {
  //           class_section: classSection,
  //           class_days: {
  //             [day]: [time],
  //           },
  //         },
  //       });

  //       setClassDays((prev) => {
  //         const times = prev[day].filter((_, i) => i !== index);
  //         return {
  //           ...prev,
  //           [day]: times,
  //         };
  //       });
  //     }
  //     mutate('classScheduleCRUD/');
  //   } catch (error) {
  //     console.error('Error deleting class schedule:', error);
  //   }
  // };

  const handleRemoveTime = (day: string, index: number) => {
    setClassDays((prev) => {
      const times = prev[day].filter((_, i) => i !== index);
      return {
        ...prev,
        [day]: times,
      };
    });
  };

  const handleRemoveClassSection = async (classSection: string) => {
    try {
      await axios.delete('classScheduleCRUD/', {
        data: {
          class_section: classSection,
        },
      });

      setClassSchedule((prev) =>
        prev.filter((schedule) => schedule.class_section !== classSection)
      );
      mutate('classScheduleCRUD/');
    } catch (error) {
      console.error('Error deleting class section:', error);
    }
  };

  const handleEditTime = (day: string, index: number) => {
    const time = classDays[day][index];
    setSelectedDay(day);
    setStartTime(time.start);
    setEndTime(time.end);
    setSelectedRow({ day, index });
    setEnableAddTime(false);
    setEnableEditTime(true);
    setEnabledClassDaySelect(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    // Ensure the last selected time is added
    handleAddTime();

    const data = {
      class_section: classSection,
      class_name: className,
      class_days: classDays,
      class_instructor: classInstructor,
    };

    console.log('Data:', data);

    try {
      const response = await axios.post('/classScheduleCRUD/', data);
      console.log('Class schedule created:', response.data);
      // Reset form fields
      setClassSection('');
      setClassName('');
      setClassDays({});
      setClassInstructor('');
      mutate('classScheduleCRUD/');
    } catch (error) {
      console.error('Error creating class schedule:', error);
    } finally {
      setLoading(false);
      setAddModalOpened(false);
    }
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const data = {
      class_section: classSection,
      class_name: className,
      class_days: classDays,
      class_instructor: classInstructor,
    };

    console.log('Data:', data);

    try {
      const response = await axios.put('/classScheduleCRUD/', data);
      console.log('Class schedule updated:', response.data);
      // Reset form fields
      setClassSection('');
      setClassName('');
      setClassDays({});
      setClassInstructor('');
      mutate('classScheduleCRUD/');
    } catch (error) {
      console.error('Error updating class schedule:', error);
    } finally {
      setLoading(false);
      setEditModalOpened(false);
    }
  };

  const { data: classScheduleData, error } = useSWR('classScheduleCRUD/', fetcher, {
    onSuccess: (data) => {
      setClassSchedule(data);
    },
  });

  const rows = classSchedule.map((element) => (
    <Table.Tr key={element.class_section}>
      <Table.Td>{element.class_section}</Table.Td>
      <Table.Td>{element.class_name}</Table.Td>
      <Table.Td>
        {Object.entries(element.class_days).map(([day, times]) => (
          <div key={day}>
            <strong>{day}:</strong>
            {times.map((time, index) => (
              <div key={index}>
                {time.start} - {time.end}
              </div>
            ))}
          </div>
        ))}
      </Table.Td>
      <Table.Td>{element.class_instructor}</Table.Td>
      <Table.Td>
        <Group>
          <Tooltip label="Edit">
            <ActionIcon
              color="blue"
              onClick={() => {
                setClassSection(element.class_section);
                setClassName(element.class_name);
                setClassInstructor(element.class_instructor);
                setClassDays(element.class_days);
                setEditModalOpened(true);
              }}
            >
              <IconEdit size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon
              color="red"
              onClick={() => {
                setItemToDelete({ classSection: element.class_section });
                setDeleteModalOpened(true);
              }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  // const editTimesRows = Object.entries(classDays).map(([day, times]) =>
  //   times.map((time, index) => (
  //     <Table.Tr key={`${day}-${index}`}>
  //       <Table.Td>
  //         <Checkbox
  //           checked={checkedTimes[`${day}-${index}`] || false}
  //           onChange={(event) => {
  //             const isChecked = event.currentTarget.checked;
  //             setCheckedTimes((prev) => ({
  //               ...prev,
  //               [`${day}-${index}`]: isChecked,
  //             }));
  //             if (isChecked) {
  //               setSelectedDay(day);
  //               setStartTime(time.start);
  //               setEndTime(time.end);
  //               setSelectedRow({ day, index });
  //               setEnableEditTime(false);
  //               setEnableAddTime(true);
  //               setEnabledClassDaySelect(true);
  //             } else {
  //               setSelectedDay(null);
  //               setStartTime('');
  //               setEndTime('');
  //               setSelectedRow(null);
  //               setEnableEditTime(true);
  //               setEnabledClassDaySelect(false);
  //             }
  //           }}
  //         />
  //       </Table.Td>
  //       <Table.Td>{day}</Table.Td>
  //       <Table.Td>
  //         {time.start} - {time.end}
  //       </Table.Td>
  //       <Table.Td>
  //         <Tooltip label="Delete">
  //           <ActionIcon
  //             color="red"
  //             onClick={() => {
  //               setItemToDelete({ classSection, day, index });
  //               setDeleteModalOpened(true);
  //             }}
  //           >
  //             <IconTrash size={16} />
  //           </ActionIcon>
  //         </Tooltip>
  //       </Table.Td>
  //     </Table.Tr>
  //   ))
  // );

  const editTimesRows = Object.entries(classDays).map(([day, times]) =>
    times.map((time, index) => (
      <Table.Tr key={`${day}-${index}`}>
        <Table.Td>
          <Checkbox
            checked={checkedTimes[`${day}-${index}`] || false}
            onChange={(event) => {
              const isChecked = event.currentTarget.checked;
              setCheckedTimes((prev) => ({
                ...prev,
                [`${day}-${index}`]: isChecked,
              }));
              if (isChecked) {
                setSelectedDay(day);
                setStartTime(time.start);
                setEndTime(time.end);
                setSelectedRow({ day, index });
                setEnableEditTime(false);
                setEnableAddTime(true);
                setEnabledClassDaySelect(true);
              } else {
                setSelectedDay(null);
                setStartTime('');
                setEndTime('');
                setSelectedRow(null);
                setEnableEditTime(true);
                setEnabledClassDaySelect(false);
              }
            }}
          />
        </Table.Td>
        <Table.Td>{day}</Table.Td>
        <Table.Td>
          {time.start} - {time.end}
        </Table.Td>
        <Table.Td>
          <Tooltip label="Delete">
            <ActionIcon color="red" onClick={() => handleRemoveTime(day, index)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Table.Td>
      </Table.Tr>
    ))
  );
  return (
    <>
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        gap={{ base: 'sm', sm: 'lg' }}
        justify={{ sm: 'center' }}
      >
        <Paper shadow="xl" radius="md" withBorder p="xl">
          <Group justify="apart" pb={30}>
            <Title order={1} w={700}>
              Class Schedule
            </Title>
            <Button onClick={() => setAddModalOpened(true)} p={10}>
              Add Class Schedule
            </Button>
          </Group>
          <Table.ScrollContainer minWidth={500}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Class Section</Table.Th>
                  <Table.Th>Class Name</Table.Th>
                  <Table.Th>Class Days</Table.Th>
                  <Table.Th>Class Adviser</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>

        <Modal
          opened={addModalOpened}
          onClose={() => {
            setAddModalOpened(false);
            // setClassName('');
            // setClassSection('');
            // setClassInstructor('');
            // setClassDays({});
            // setSelectedDay('');
            // setEndTime('');
            // setStartTime('');
            // setEnableAddTime(false);
            // setEnableEditTime(false);
            // setEnabledClassDaySelect(false);
            setSelectedRow(null);
            setClassDays({});
            setClassName('');
            setClassSection('');
            setClassInstructor('');
            setSelectedDay('');
            setStartTime('');
            setEndTime('');
            setCheckedTimes({});
            setEnableAddTime(false);
            setEnableEditTime(true);
            setEnabledClassDaySelect(false);
          }}
          title="Add Class Schedule"
          size="md"
        >
          <Paper shadow="xl" radius="md" withBorder p="md">
            <form onSubmit={handleSubmit}>
              <Stack>
                <TextInput
                  label="Class Section"
                  value={classSection}
                  onChange={(event) => setClassSection(event.currentTarget.value)}
                  required
                />
                <TextInput
                  label="Class Name"
                  value={className}
                  onChange={(event) => setClassName(event.currentTarget.value)}
                  required
                />
                <TextInput
                  label="Class Instructor"
                  value={classInstructor}
                  onChange={(event) => setClassInstructor(event.currentTarget.value)}
                  required
                />
                <Select
                  label="Day"
                  placeholder="Select a day"
                  value={selectedDay}
                  onChange={(value) => setSelectedDay(value ?? '')}
                  data={[
                    { value: 'Monday', label: 'Monday' },
                    { value: 'Tuesday', label: 'Tuesday' },
                    { value: 'Wednesday', label: 'Wednesday' },
                    { value: 'Thursday', label: 'Thursday' },
                    { value: 'Friday', label: 'Friday' },
                    { value: 'Saturday', label: 'Saturday' },
                    { value: 'Sunday', label: 'Sunday' },
                  ]}
                  clearable
                  disabled={enabledClassDaySelect}
                />

                <TimeInput
                  label="Start Time"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.currentTarget.value);
                    setEnableAddTime(false);
                  }}
                />
                <TimeInput
                  label="End Time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.currentTarget.value)}
                />
                <Button
                  onClick={handleAddTime}
                  disabled={
                    selectedDay || endTime || startTime ? (enableAddTime ? true : false) : true
                  }
                >
                  Add Time
                </Button>

                <Button onClick={handleUpdateTime} disabled={enableEditTime}>
                  Update Time
                </Button>
                <Paper shadow="xl" radius="md" withBorder p="md">
                  <Table.ScrollContainer minWidth={500}>
                    <Table striped highlightOnHover withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Select</Table.Th>
                          <Table.Th>Day</Table.Th>
                          <Table.Th>Times</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>{editTimesRows}</Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Paper>
                <Group justify="right">
                  <Button type="submit" loading={loading}>
                    Submit Class Schedule
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </Modal>

        <Modal
          opened={editModalOpened}
          onClose={() => {
            setEditModalOpened(false);
            setSelectedRow(null);
            setClassDays({});
            setClassName('');
            setClassSection('');
            setClassInstructor('');
            setSelectedDay('');
            setStartTime('');
            setEndTime('');
            setCheckedTimes({});
            setEnableAddTime(false);
            setEnableEditTime(true);
            setEnabledClassDaySelect(false);
          }}
          title="Edit Class Schedule"
          size="md"
        >
          <Paper shadow="xl" radius="md" withBorder p="md">
            <form onSubmit={handleEditSubmit}>
              <Stack>
                <TextInput
                  label="Class Section"
                  value={classSection}
                  onChange={(event) => setClassSection(event.currentTarget.value)}
                  required
                />
                <TextInput
                  label="Class Name"
                  value={className}
                  onChange={(event) => setClassName(event.currentTarget.value)}
                  required
                />
                <TextInput
                  label="Class Instructor"
                  value={classInstructor}
                  onChange={(event) => setClassInstructor(event.currentTarget.value)}
                  required
                />
                <Select
                  label="Day"
                  placeholder="Select a day"
                  value={selectedDay}
                  onChange={(value) => setSelectedDay(value ?? '')}
                  data={[
                    { value: 'Monday', label: 'Monday' },
                    { value: 'Tuesday', label: 'Tuesday' },
                    { value: 'Wednesday', label: 'Wednesday' },
                    { value: 'Thursday', label: 'Thursday' },
                    { value: 'Friday', label: 'Friday' },
                    { value: 'Saturday', label: 'Saturday' },
                    { value: 'Sunday', label: 'Sunday' },
                  ]}
                  clearable
                  disabled={enabledClassDaySelect}
                />

                <TimeInput
                  label="Start Time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.currentTarget.value)}
                />
                <TimeInput
                  label="End Time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.currentTarget.value)}
                />
                <Button
                  onClick={handleAddTime}
                  disabled={
                    Object.values(checkedTimes).includes(true) ||
                    !selectedDay ||
                    !startTime ||
                    !endTime
                  }
                >
                  Add Time
                </Button>
                <Button
                  onClick={handleUpdateTime}
                  disabled={!Object.values(checkedTimes).includes(true)}
                >
                  Update Time
                </Button>
                <Table.ScrollContainer minWidth={300}>
                  <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Select</Table.Th>
                        <Table.Th>Day</Table.Th>
                        <Table.Th>Times</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{editTimesRows}</Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                <Group justify="right">
                  <Button type="submit" loading={loading}>
                    Update Class Schedule
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </Modal>

        <Modal
          opened={deleteModalOpened}
          onClose={() => setDeleteModalOpened(false)}
          title="Confirm Delete"
          size="sm"
        >
          <Paper shadow="xl" radius="md" withBorder p="md">
            <Text>Are you sure you want to delete this item?</Text>
            <Group justify="right" mt="md">
              <Button onClick={() => setDeleteModalOpened(false)}>Cancel</Button>
              <Button color="red" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </Group>
          </Paper>
        </Modal>
      </Flex>
    </>
  );
}
