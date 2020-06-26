package com.step902020.capstone;

import java.util.List;
import org.springframework.cloud.gcp.data.datastore.repository.DatastoreRepository;

public interface UserRepository extends DatastoreRepository<User, Long> {

  public List<User> findByEmail(String email);

  public long deleteByEmail(String email);
}
