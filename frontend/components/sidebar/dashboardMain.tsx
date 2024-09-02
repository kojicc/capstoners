import { Paper, SimpleGrid } from "@mantine/core";
import React from "react";
import { StatsRing } from "../dashboard/dashboardTab";
import { LineReservations } from "../dashboard/lineReservations";
import { ProgressProducts } from "../dashboard/progressbarProducts";
import { StatsGroup } from "../dashboard/StatsGroup";


export function Dashboard() {
    return (
        <div>
           <Paper p="xl" shadow="xl" style={{ height: 'auto' }} >
            <SimpleGrid cols={1} spacing="lg">
           <StatsRing/>
  <LineReservations/>
<ProgressProducts/>
<StatsGroup/>
</SimpleGrid>            </Paper>
        </div>
    );
}