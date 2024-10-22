import { useState, useEffect } from 'react';
import { Table, TextInput, ScrollArea, UnstyledButton, Group, Center, rem, Pagination ,Text} from '@mantine/core';
import { IconSelector, IconChevronDown, IconChevronUp, IconSearch } from '@tabler/icons-react';
import moment from 'moment-timezone';

interface TableProps {
  data: any[];
  columns: { label: string; key: string }[];
  onRowClick?: (row: any) => void;
  actionButtons?: (row: any) => JSX.Element;
  itemsPerPage?: number;
}

export function ReusableTable({
  data,
  columns,
  onRowClick,
  actionButtons,
  itemsPerPage = 5,
}: TableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);
  const [sortedData, setSortedData] = useState<any[]>([]);
  const [activePage, setPage] = useState(1);

  useEffect(() => {
    setSortedData(sortData(data, { sortBy, reversed: reverseSortDirection, search: searchQuery }));
  }, [data, sortBy, reverseSortDirection, searchQuery]);

  function Th({ label, sorted, reversed, onSort }: any) {
    const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
    return (
      <Table.Th>
        <UnstyledButton onClick={onSort}>
          <Group justify="space-between">
            <Text fw={500} fz="sm">{label}</Text>
            <Center>
              <Icon style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
            </Center>
          </Group>
        </UnstyledButton>
      </Table.Th>
    );
  }

  function sortData(data: any[], { sortBy, reversed, search }: { sortBy: string | null, reversed: boolean, search: string }) {
    const filteredData = filterData(data, search);
    return filteredData.sort((a, b) => {
      if (!sortBy) return 0;
      const aValue = a[sortBy] ? a[sortBy].toLowerCase() : '';
      const bValue = b[sortBy] ? b[sortBy].toLowerCase() : '';
      return reversed ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
    });
  }

  function filterData(data: any[], search: string) {
    const query = search.toLowerCase().trim();
    return data.filter((item) => {
      return columns.some((col) => item[col.key]?.toLowerCase().includes(query));
    });
  }

  const paginatedData = sortedData.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  return (
    <div>
      <TextInput
        placeholder="Search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.currentTarget.value)}
        rightSection={<IconSearch style={{ width: rem(16), height: rem(16) }} stroke={1.5} />}
        mb="md"
      />
      <ScrollArea>
        <Table>
          <thead>
            <tr>
              {columns.map((col) => (
                <Th
                  key={col.key}
                  label={col.label}
                  sorted={sortBy === col.key}
                  reversed={reverseSortDirection}
                  onSort={() => {
                    const reversed = sortBy === col.key ? !reverseSortDirection : false;
                    setReverseSortDirection(reversed);
                    setSortBy(col.key);
                  }}
                />
              ))}
              {actionButtons && <Th label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={index} onClick={() => onRowClick && onRowClick(row)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.key.includes('date') ? moment(row[col.key]).format('YYYY-MM-DD HH:mm') : row[col.key]}</td>
                ))}
                {actionButtons && <td>{actionButtons(row)}</td>}
              </tr>
            ))}
          </tbody>
        </Table>
      </ScrollArea>
      <Pagination
        value={activePage}
        onChange={setPage}
        total={Math.ceil(sortedData.length / itemsPerPage)}
        mt="md"
      />
    </div>
  );
}


// usage
// export default function AdminTransactionHistory() {
//     const [reservations, setReservations] = useState([]);
  
//     useEffect(() => {
//       // Fetch reservations here and set them in state
//     }, []);
  
//     return (
//       <ReusableTable
//         data={reservations}
//         columns={[
//           { label: 'Reservation ID', key: 'reservation_id' },
//           { label: 'Reservation Date Start', key: 'reservation_date' },
//           { label: 'Reservation Date End', key: 'reservation_date_end' },
//           { label: 'Purpose', key: 'reservation_purpose' },
//           { label: 'Product IDs', key: 'product_ids' },
//           { label: 'Quantities', key: 'quantities' },
//           { label: 'Status', key: 'status' },
//         ]}
//         actionButtons={(row) => (
//           <>
//             <ActionIcon onClick={() => editReservation(row)}>
//               <IconEdit />
//             </ActionIcon>
//             <ActionIcon color="red" onClick={() => deleteReservation(row)}>
//               <IconTrash />
//             </ActionIcon>
//           </>
//         )}
//       />
//     );
//   }

// usage2
// export default function UserTransactionHistory() {
//     const [reservations, setReservations] = useState([]);
  
//     useEffect(() => {
//       // Fetch reservations here and set them in state
//     }, []);
  
//     return (
//       <ReusableTable
//         data={reservations}
//         columns={[
//           { label: 'Reservation ID', key: 'reservation_id' },
//           { label: 'Reservation Date Start', key: 'reservation_date' },
//           { label: 'Reservation Date End', key: 'reservation_date_end' },
//           { label: 'Purpose', key: 'reservation_purpose' },
//           { label: 'Product IDs', key: 'product_ids' },
//           { label: 'Quantities', key: 'quantities' },
//           { label: 'Status', key: 'status' },
//         ]}
//       />
//     );
//   }
  
  