package com.step902020.capstone;

import org.springframework.cloud.gcp.data.datastore.repository.DatastoreRepository;
/**
 * Spring Data Repository for Event Entities
 */
public interface EventRepository extends DatastoreRepository<Event, Long> {
    @Query("select * from event where requiredFood  @name and name < @endname and university = @university")
    public List<Organization> findEventsByFilters(
            @Param("foodAvailable") List<Boolean> food,
            @Param("requiredFee") List<Boolean> fee);
}
