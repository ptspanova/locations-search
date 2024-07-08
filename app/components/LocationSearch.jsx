'use client'

import {useEffect, useMemo, useState} from "react";
import debounce from "lodash.debounce";


const LocationsSearch = () => {
    const [locations, setLocations] = useState([]);
    const [filteredLocations, setFilteredLocations] = useState([]);
    const [userLocation, setUserLocation] = useState(null);

    const fetchLocations = async () => {
        try {
            await fetch("https://countriesnow.space/api/v0.1/countries/positions")
                .then( (response) => response.json())
                .then((data) => setLocations(data.data));
        } catch (e) {
            console.error(e);
        }
    }

    const fetchUserLocations = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(position => {
                setUserLocation({
                    lat: position.coords.latitude,
                    long: position.coords.longitude,
                });
            })
        }
    }

    useEffect(() => {
        fetchLocations();
        fetchUserLocations();

    }, []);


    const handleSearch = (searchTerm) => {
        if(searchTerm === '') {
            fetchLocations()
        }

        searchTerm = searchTerm.toLowerCase();

        const filterBySearch = locations.filter((location) =>
            location.name.toLowerCase().startsWith(searchTerm)
        );
        setFilteredLocations(filterBySearch);

        if (searchTerm === '') {
            setFilteredLocations([])
        }
    }

    const  closestLocation = (targetLocation, locationData) => {
        const vectorDistance = (dx, dy) => {
            return Math.sqrt(dx * dx + dy * dy);
        }

        const locationDistance = (location1, location2) => {
            let dx = location1.lat - location2.lat,
                dy = location1.long - location2.long;

            return vectorDistance(dx, dy);
        }

        return locationDistance(targetLocation, locationData);
    }

    const sortByClosest = (location1, location2) => {
        const distance1 = closestLocation(userLocation, location1);
        const distance2 = closestLocation(userLocation, location2);

        if (distance1 > distance2) {
            return 1
        }

        if (distance2 > distance1) {
            return -1
        }

        return 0
    }


    const debouncedResults = useMemo(() => {
        return debounce(handleSearch, 1000);
    }, [locations]);

    useEffect(() => {
        return () => {
            debouncedResults.cancel();
        };
    }, [debouncedResults]);

    return (
        <>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 5, marginTop: "300px"}}>
                <div>Number of locations: {locations.length}</div>
                {(locations.length > 0 && userLocation)? (
                    <>
                    <div style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10
                    }}>
                        <h1>Search for location</h1>
                        <input
                            placeholder={"Search for location"}
                            onChange={(e) => debouncedResults(e.target.value)}
                        />
                    </div>
                    <div>
                        {(filteredLocations.length > 0 && userLocation) ? (
                            filteredLocations.sort(sortByClosest).map((location, index) => (
                                <div key={index}>
                                    <div>{location.name}</div>
                                    <div>{location.lat}</div>
                                    <div>{location.long}</div>
                                </div>
                            ))
                        ) : (
                            <p>No locations found</p>
                        )}
                    </div>
                    <p>Your coordinates: </p>
                    <div>{userLocation?.lat}</div>
                    <div>{userLocation?.long}</div>
                    </>
                ) : (
                    <p>LOADING...</p>
                    )}
            </div>
        </>
    );
}

export default LocationsSearch;
